using Microsoft.AspNetCore.Mvc;
using EthnovetChat.DataAccessLayer.Models;
using EthnovetChat.DataAccessLayer.Repositories;
using EthnovetChat.ServiceLayer.DTOs;
using EthnovetChat.ServiceLayer.Services;

namespace EthnovetChat.ServiceLayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly IEthnovetRepository _repository;
        private readonly IGeminiService _geminiService;
        private readonly ISessionService _sessionService;
        private readonly IUserAuthService _authService;

        public ChatController(
            IChatService chatService,
            IEthnovetRepository repository,
            IGeminiService geminiService,
            ISessionService sessionService,
            IUserAuthService authService)
        {
            _chatService = chatService;
            _repository = repository;
            _geminiService = geminiService;
            _sessionService = sessionService;
            _authService = authService;
        }

        private Guid? GetAuthenticatedUserId()
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            return _authService.ValidateTokenAndGetUserId(authHeader);
        }

        /// <summary>
        /// Chat with EthnoVet Assistant: provides traditional veterinary remedies for animal ailments.
        /// Supports English and Tamil queries, and maintains rolling 5-turn session memory.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ChatResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Chat([FromBody] ChatRequestDto request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { error = "Message is required." });
            }

            var userId = GetAuthenticatedUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "Authentication required. Please sign in or register to consult the EthnoVet AI." });
            }
            request.UserId = userId.Value;

            var response = await _chatService.ProcessChatAsync(request, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Stream chat responses in real-time with Server-Sent Events (SSE).
        /// Emits meta, token, and done events for instant word-by-word display.
        /// Automatically links conversation turns to the authenticated farmer account in PostgreSQL.
        /// </summary>
        [HttpPost("stream")]
        public async Task StreamChat([FromBody] ChatRequestDto request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Message))
            {
                Response.StatusCode = StatusCodes.Status400BadRequest;
                await Response.WriteAsync("{\"error\":\"Message is required.\"}", cancellationToken);
                return;
            }

            var userId = GetAuthenticatedUserId();
            if (!userId.HasValue)
            {
                Response.StatusCode = StatusCodes.Status401Unauthorized;
                Response.Headers.Append("Content-Type", "application/json");
                await Response.WriteAsync("{\"error\":\"Authentication required. Please sign in or register to consult the EthnoVet AI.\"}", cancellationToken);
                return;
            }
            request.UserId = userId.Value;

            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");

            var jsonOptions = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
            };

            await foreach (var evt in _chatService.StreamChatAsync(request, cancellationToken))
            {
                var payload = System.Text.Json.JsonSerializer.Serialize(evt, jsonOptions);
                await Response.WriteAsync($"data: {payload}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }

        /// <summary>
        /// Get all past consultation sessions for the currently logged-in farmer from PostgreSQL.
        /// </summary>
        [HttpGet("user-sessions")]
        public async Task<IActionResult> GetUserSessions(CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Authentication token required." });
            }

            var sessions = await _sessionService.GetUserSessionsAsync(userId.Value, cancellationToken);
            return Ok(sessions);
        }

        /// <summary>
        /// Get full transcript of a specific past consultation session from PostgreSQL.
        /// </summary>
        [HttpGet("user-sessions/{sessionId}")]
        public async Task<IActionResult> GetUserSessionDetail(string sessionId, CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Authentication token required." });
            }

            var detail = await _sessionService.GetUserSessionDetailAsync(userId.Value, sessionId, cancellationToken);
            if (detail == null)
            {
                return NotFound(new { message = "Consultation session not found." });
            }

            return Ok(detail);
        }

        /// <summary>
        /// Delete a past consultation session from PostgreSQL and in-memory cache.
        /// </summary>
        [HttpDelete("user-sessions/{sessionId}")]
        public async Task<IActionResult> DeleteUserSession(string sessionId, CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Authentication token required." });
            }

            var deleted = await _sessionService.DeleteUserSessionAsync(userId.Value, sessionId, cancellationToken);
            return Ok(new { success = deleted, sessionId });
        }

        /// <summary>
        /// Search or filter ethnoveterinary remedies directly.
        /// </summary>
        [HttpGet("remedies")]
        [ProducesResponseType(typeof(IEnumerable<RemedyDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRemedies(
            [FromQuery] string? query,
            [FromQuery] string? animal,
            [FromQuery] string? disease,
            [FromQuery] int limit = 10,
            CancellationToken cancellationToken = default)
        {
            var filter = new SearchFilter
            {
                Query = query,
                Animal = animal,
                Disease = disease,
                Limit = limit
            };

            var list = await _repository.SearchAsync(filter, cancellationToken);
            return Ok(list.Select(RemedyDto.FromEntity));
        }

        /// <summary>
        /// Get a specific remedy by its unique ID (0 to 50).
        /// </summary>
        [HttpGet("remedies/{id:int}")]
        [ProducesResponseType(typeof(RemedyDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRemedyById(int id, CancellationToken cancellationToken)
        {
            var remedy = await _repository.GetByIdAsync(id, cancellationToken);
            if (remedy == null)
            {
                return NotFound(new { error = $"Remedy with ID {id} not found." });
            }

            return Ok(RemedyDto.FromEntity(remedy));
        }

        /// <summary>
        /// List all distinct livestock diseases present in the ethnovet knowledge base.
        /// </summary>
        [HttpGet("diseases")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDiseases(CancellationToken cancellationToken)
        {
            var diseases = await _repository.GetDistinctDiseasesAsync(cancellationToken);
            return Ok(diseases);
        }

        /// <summary>
        /// List all distinct animal categories present in the ethnovet knowledge base.
        /// </summary>
        [HttpGet("animals")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAnimals(CancellationToken cancellationToken)
        {
            var animals = await _repository.GetDistinctAnimalsAsync(cancellationToken);
            return Ok(animals);
        }

        /// <summary>
        /// Get conversational history and metadata for a specific chat session.
        /// </summary>
        [HttpGet("sessions/{sessionId}")]
        public IActionResult GetSessionHistory(string sessionId)
        {
            var session = _sessionService.GetSession(sessionId);
            if (session == null)
            {
                return NotFound(new { error = "Session not found." });
            }

            return Ok(new
            {
                sessionId = session.SessionId,
                createdAt = session.CreatedAt,
                lastActiveAt = session.LastActiveAt,
                persistedAnimal = session.PersistedAnimal,
                persistedLanguage = session.PersistedLanguage,
                messages = session.Messages
            });
        }

        /// <summary>
        /// Reset / clear a chat session to immediately free server memory.
        /// </summary>
        [HttpDelete("sessions/{sessionId}")]
        public IActionResult ResetSession(string sessionId)
        {
            var cleared = _sessionService.ClearSession(sessionId);
            return Ok(new { success = true, cleared, sessionId });
        }

        /// <summary>
        /// Health check and status of EthnoVetChat service and Gemini configuration.
        /// </summary>
        [HttpGet("health")]
        public async Task<IActionResult> Health(CancellationToken cancellationToken)
        {
            var all = await _repository.GetAllAsync(cancellationToken);
            return Ok(new
            {
                status = "Healthy",
                totalRemediesLoaded = all.Count,
                geminiConfigured = _geminiService.IsConfigured,
                supportedLanguages = new[] { "en", "ta" }
            });
        }
    }
}

