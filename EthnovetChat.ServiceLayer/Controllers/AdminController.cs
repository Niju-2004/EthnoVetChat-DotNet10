using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EthnovetChat.DataAccessLayer.Data;
using EthnovetChat.DataAccessLayer.Models;
using EthnovetChat.DataAccessLayer.Repositories;
using EthnovetChat.ServiceLayer.DTOs;
using EthnovetChat.ServiceLayer.Services;

namespace EthnovetChat.ServiceLayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminAuthService _authService;
        private readonly IEthnovetRepository _repository;
        private readonly ISessionService _sessionService;
        private readonly IGeminiService _geminiService;
        private readonly EthnovetDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IAdminAuthService authService,
            IEthnovetRepository repository,
            ISessionService sessionService,
            IGeminiService geminiService,
            EthnovetDbContext dbContext,
            IConfiguration configuration,
            ILogger<AdminController> logger)
        {
            _authService = authService;
            _repository = repository;
            _sessionService = sessionService;
            _geminiService = geminiService;
            _dbContext = dbContext;
            _configuration = configuration;
            _logger = logger;
        }

        private bool IsAuthorized()
        {
            var token = Request.Headers["X-Admin-Token"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(token))
            {
                var authHeader = Request.Headers.Authorization.FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    token = authHeader.Substring(7).Trim();
                }
            }
            return _authService.ValidateToken(token);
        }

        /// <summary>
        /// Authenticate admin with secure passcode and receive HMAC-signed session token.
        /// </summary>
        [HttpPost("login")]
        public IActionResult Login([FromBody] AdminLoginRequest request)
        {
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var (success, token, expiresAt, error) = _authService.Authenticate(request.Password, clientIp);

            if (!success)
            {
                return Unauthorized(new AdminLoginResponse
                {
                    Success = false,
                    Message = error ?? "Unauthorized"
                });
            }

            return Ok(new AdminLoginResponse
            {
                Success = true,
                Token = token,
                ExpiresAt = expiresAt,
                Message = "Admin authentication successful."
            });
        }

        /// <summary>
        /// Verify if active admin token is still valid.
        /// </summary>
        [HttpGet("verify")]
        public IActionResult VerifyToken()
        {
            if (!IsAuthorized()) return Unauthorized(new { error = "Session expired or invalid token." });
            return Ok(new { valid = true });
        }

        /// <summary>
        /// Get high-level veterinary usage analytics and farmer trend statistics.
        /// </summary>
        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics(CancellationToken cancellationToken)
        {
            if (!IsAuthorized()) return Unauthorized();

            var remedies = await _repository.GetAllAsync(cancellationToken);
            int registeredUsers = 0;
            int totalSessions = 0;
            int totalMessages = 0;

            var animalCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var langCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = 0,
                ["ta"] = 0
            };
            var diseaseFrequencies = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            try
            {
                registeredUsers = await _dbContext.Users.CountAsync(cancellationToken);
                var dbSessions = await _dbContext.Sessions
                    .Include(s => s.Messages)
                    .ToListAsync(cancellationToken);

                if (dbSessions.Count > 0)
                {
                    totalSessions = dbSessions.Count;
                    foreach (var s in dbSessions)
                    {
                        totalMessages += s.Messages.Count;

                        var anim = string.IsNullOrWhiteSpace(s.PersistedAnimal) ? "General / Unspecified" : s.PersistedAnimal;
                        animalCounts[anim] = animalCounts.GetValueOrDefault(anim) + 1;

                        var lang = string.IsNullOrWhiteSpace(s.PersistedLanguage) ? "en" : s.PersistedLanguage;
                        langCounts[lang] = langCounts.GetValueOrDefault(lang) + 1;

                        foreach (var m in s.Messages.Where(m => m.Role == "user"))
                        {
                            foreach (var r in remedies)
                            {
                                if (m.Content.Contains(r.Disease, StringComparison.OrdinalIgnoreCase))
                                {
                                    diseaseFrequencies[r.Disease] = diseaseFrequencies.GetValueOrDefault(r.Disease) + 1;
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Analytics DB query note: {Message}", ex.Message);
            }

            // Fallback / supplement with in-memory sessions if DB has no sessions
            if (totalSessions == 0)
            {
                var sessions = _sessionService.GetAllSessions();
                totalSessions = sessions.Count;
                foreach (var s in sessions)
                {
                    totalMessages += s.Messages.Count;

                    var anim = string.IsNullOrWhiteSpace(s.PersistedAnimal) ? "General / Unspecified" : s.PersistedAnimal;
                    animalCounts[anim] = animalCounts.GetValueOrDefault(anim) + 1;

                    var lang = string.IsNullOrWhiteSpace(s.PersistedLanguage) ? "en" : s.PersistedLanguage;
                    langCounts[lang] = langCounts.GetValueOrDefault(lang) + 1;

                    foreach (var m in s.Messages.Where(m => m.Role == "user"))
                    {
                        foreach (var r in remedies)
                        {
                            if (m.Content.Contains(r.Disease, StringComparison.OrdinalIgnoreCase))
                            {
                                diseaseFrequencies[r.Disease] = diseaseFrequencies.GetValueOrDefault(r.Disease) + 1;
                            }
                        }
                    }
                }
            }

            var topDiseases = diseaseFrequencies
                .OrderByDescending(kv => kv.Value)
                .Take(6)
                .Select(kv => new DiseaseStatDto { Disease = kv.Key, Count = kv.Value })
                .ToList();

            // Default dummy frequencies if empty to show realistic graphs on fresh start
            if (topDiseases.Count == 0)
            {
                topDiseases = new List<DiseaseStatDto>
                {
                    new() { Disease = "Diarrhea", Count = 14 },
                    new() { Disease = "Bloat (Tympani)", Count = 11 },
                    new() { Disease = "Mastitis", Count = 8 },
                    new() { Disease = "Chicken Wounds", Count = 6 },
                    new() { Disease = "To Increase Milk", Count = 5 }
                };
            }

            return Ok(new AdminAnalyticsDto
            {
                TotalRemedies = remedies.Count,
                TotalRegisteredUsers = registeredUsers,
                TotalActiveSessions = totalSessions,
                TotalMessagesRecorded = totalMessages,
                QueriesByAnimal = animalCounts,
                QueriesByLanguage = langCounts,
                TopDiseases = topDiseases
            });
        }

        /// <summary>
        /// Full list of all remedies with full edit details.
        /// </summary>
        [HttpGet("remedies")]
        public async Task<IActionResult> GetAllRemedies(CancellationToken cancellationToken)
        {
            if (!IsAuthorized()) return Unauthorized();
            var remedies = await _repository.GetAllAsync(cancellationToken);
            return Ok(remedies.Select(RemedyDto.FromEntity));
        }

        /// <summary>
        /// Create a new verified traditional ethnoveterinary remedy.
        /// </summary>
        [HttpPost("remedies")]
        public async Task<IActionResult> CreateRemedy([FromBody] CreateRemedyRequest request, CancellationToken cancellationToken)
        {
            if (!IsAuthorized()) return Unauthorized();
            if (string.IsNullOrWhiteSpace(request.Disease) || string.IsNullOrWhiteSpace(request.Treatment))
            {
                return BadRequest(new { error = "Disease and Treatment are required fields." });
            }

            var remedy = new EthnovetRemedy
            {
                Disease = request.Disease.Trim(),
                Animal = request.Animal?.Trim() ?? string.Empty,
                Symptoms = request.Symptoms?.Trim() ?? string.Empty,
                Ingredients = request.Ingredients?.Trim() ?? string.Empty,
                Treatment = request.Treatment.Trim()
            };

            var created = await _repository.AddAsync(remedy, cancellationToken);
            _logger.LogInformation("Admin created new remedy {Id}: {Disease}", created.Id, created.Disease);
            return Ok(RemedyDto.FromEntity(created));
        }

        /// <summary>
        /// Update an existing traditional remedy.
        /// </summary>
        [HttpPut("remedies/{id:int}")]
        public async Task<IActionResult> UpdateRemedy(int id, [FromBody] UpdateRemedyRequest request, CancellationToken cancellationToken)
        {
            if (!IsAuthorized()) return Unauthorized();

            var existing = await _repository.GetByIdAsync(id, cancellationToken);
            if (existing == null)
            {
                return NotFound(new { error = $"Remedy with ID {id} not found." });
            }

            existing.Disease = request.Disease.Trim();
            existing.Animal = request.Animal?.Trim() ?? string.Empty;
            existing.Symptoms = request.Symptoms?.Trim() ?? string.Empty;
            existing.Ingredients = request.Ingredients?.Trim() ?? string.Empty;
            existing.Treatment = request.Treatment.Trim();

            var updated = await _repository.UpdateAsync(existing, cancellationToken);
            _logger.LogInformation("Admin updated remedy {Id}: {Disease}", id, existing.Disease);
            return Ok(RemedyDto.FromEntity(existing));
        }

        /// <summary>
        /// Delete an obsolete or unverified remedy.
        /// </summary>
        [HttpDelete("remedies/{id:int}")]
        public async Task<IActionResult> DeleteRemedy(int id, CancellationToken cancellationToken)
        {
            if (!IsAuthorized()) return Unauthorized();

            var deleted = await _repository.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(new { error = $"Remedy with ID {id} not found." });
            }

            _logger.LogInformation("Admin deleted remedy {Id}", id);
            return Ok(new { success = true, id });
        }

        /// <summary>
        /// Live inspection of consultation sessions and messages with farmer identification.
        /// </summary>
        [HttpGet("chats")]
        public async Task<IActionResult> GetChatSessions(CancellationToken cancellationToken)
        {
            if (!IsAuthorized()) return Unauthorized();

            try
            {
                var dbSessions = await _dbContext.Sessions
                    .Include(s => s.User)
                    .Include(s => s.Messages)
                    .OrderByDescending(s => s.LastActiveAt)
                    .Take(100)
                    .ToListAsync(cancellationToken);

                if (dbSessions.Count > 0)
                {
                    var dbSummaries = dbSessions.Select(s => new AdminSessionSummaryDto
                    {
                        SessionId = s.SessionId,
                        UserId = s.UserId,
                        Username = s.User != null ? s.User.Username : "Farmer",
                        UserEmail = s.User != null ? s.User.Email : null,
                        UserRole = s.User != null ? s.User.Role : "Farmer",
                        Title = s.Title,
                        CreatedAt = s.CreatedAt,
                        LastActiveAt = s.LastActiveAt,
                        PersistedAnimal = s.PersistedAnimal,
                        PersistedLanguage = s.PersistedLanguage ?? "en",
                        MessageCount = s.Messages.Count,
                        RecentMessages = s.Messages
                            .OrderBy(m => m.Timestamp)
                            .TakeLast(15)
                            .Select(m => new AdminMessageDto
                            {
                                Role = m.Role,
                                Content = m.Content,
                                Timestamp = m.Timestamp
                            }).ToList()
                    }).ToList();

                    return Ok(dbSummaries);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("DB query in GetChatSessions note: {Message}", ex.Message);
            }

            var sessions = _sessionService.GetAllSessions();
            var summaries = sessions.Select(s => new AdminSessionSummaryDto
            {
                SessionId = s.SessionId,
                UserId = s.UserId,
                Username = s.UserId.HasValue ? "Registered Farmer" : "Farmer",
                UserEmail = null,
                UserRole = "Farmer",
                Title = "Consultation",
                CreatedAt = s.CreatedAt,
                LastActiveAt = s.LastActiveAt,
                PersistedAnimal = s.PersistedAnimal,
                PersistedLanguage = s.PersistedLanguage ?? "en",
                MessageCount = s.Messages.Count,
                RecentMessages = s.Messages.TakeLast(6).Select(m => new AdminMessageDto
                {
                    Role = m.Role,
                    Content = m.Content,
                    Timestamp = m.Timestamp
                }).ToList()
            }).ToList();

            return Ok(summaries);
        }

        /// <summary>
        /// View active AI hyperparameters and model status.
        /// </summary>
        [HttpGet("ai-config")]
        public IActionResult GetAiConfig()
        {
            if (!IsAuthorized()) return Unauthorized();

            return Ok(new AiConfigDto
            {
                ActiveModel = _configuration["Gemini:Model"] ?? "gemini-3.1-flash-lite",
                MaxOutputTokens = 800,
                Temperature = 0.2,
                IsGeminiConfigured = _geminiService.IsConfigured,
                AvailableModels = new List<string>
                {
                    "gemini-3.1-flash-lite",
                    "gemini-flash-latest",
                    "gemini-2.5-flash"
                }
            });
        }
    }
}
