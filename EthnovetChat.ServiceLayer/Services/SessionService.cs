using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using EthnovetChat.DataAccessLayer.Data;
using EthnovetChat.DataAccessLayer.Models;
using EthnovetChat.ServiceLayer.DTOs;

namespace EthnovetChat.ServiceLayer.Services
{
    public class SessionService : ISessionService, IDisposable
    {
        private readonly ConcurrentDictionary<string, ChatSession> _sessions = new();
        private readonly TimeSpan _expirationWindow = TimeSpan.FromHours(1);
        private readonly Timer _cleanupTimer;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SessionService> _logger;

        public SessionService(IServiceScopeFactory scopeFactory, ILogger<SessionService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            // Run in-memory session cleanup every 15 minutes
            _cleanupTimer = new Timer(EvictExpiredSessions, null, TimeSpan.FromMinutes(15), TimeSpan.FromMinutes(15));
        }

        public ChatSession GetOrCreateSession(string? sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
            {
                var newSession = new ChatSession();
                _sessions[newSession.SessionId] = newSession;
                return newSession;
            }

            return _sessions.GetOrAdd(sessionId.Trim(), id => new ChatSession { SessionId = id });
        }

        public IReadOnlyList<ChatMessage> GetRollingHistory(string sessionId, int maxTurns = 5)
        {
            if (_sessions.TryGetValue(sessionId, out var session))
            {
                session.LastActiveAt = DateTime.UtcNow;
                return session.GetRecentHistory(maxTurns);
            }

            return Array.Empty<ChatMessage>();
        }

        public void RecordTurn(
            string sessionId,
            string userMessage,
            string aiResponse,
            string? animal,
            string language,
            Guid? userId = null,
            string? relevantRemediesJson = null)
        {
            // 1. Fast-path In-Memory cache update (keeps streaming instant)
            var session = GetOrCreateSession(sessionId);
            session.LastActiveAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(animal))
            {
                session.PersistedAnimal = animal;
            }

            if (!string.IsNullOrWhiteSpace(language))
            {
                session.PersistedLanguage = language;
            }

            session.Messages.Add(new ChatMessage
            {
                Role = "user",
                Content = userMessage,
                Timestamp = DateTime.UtcNow
            });

            session.Messages.Add(new ChatMessage
            {
                Role = "model",
                Content = aiResponse,
                Timestamp = DateTime.UtcNow
            });

            if (session.Messages.Count > 20)
            {
                session.Messages = session.Messages.Skip(session.Messages.Count - 20).ToList();
            }

            // 2. Persistent Storage in Neon.tech PostgreSQL (background task)
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<EthnovetDbContext>();

                    var persistentSession = await db.Sessions
                        .Include(s => s.Messages)
                        .FirstOrDefaultAsync(s => s.SessionId == sessionId);

                    if (persistentSession == null)
                    {
                        var title = userMessage.Length > 45 ? userMessage.Substring(0, 45) + "..." : userMessage;
                        if (!string.IsNullOrWhiteSpace(animal))
                        {
                            title = $"{char.ToUpper(animal[0])}{animal[1..]}: {title}";
                        }

                        persistentSession = new PersistentSession
                        {
                            Id = Guid.NewGuid(),
                            SessionId = sessionId,
                            UserId = userId,
                            Title = title,
                            PersistedAnimal = animal,
                            PersistedLanguage = language,
                            CreatedAt = DateTime.UtcNow,
                            LastActiveAt = DateTime.UtcNow
                        };
                        db.Sessions.Add(persistentSession);
                    }
                    else
                    {
                        persistentSession.LastActiveAt = DateTime.UtcNow;
                        if (userId.HasValue && !persistentSession.UserId.HasValue)
                        {
                            persistentSession.UserId = userId;
                        }
                        if (!string.IsNullOrWhiteSpace(animal))
                        {
                            persistentSession.PersistedAnimal = animal;
                        }
                        if (!string.IsNullOrWhiteSpace(language))
                        {
                            persistentSession.PersistedLanguage = language;
                        }
                    }

                    // Append user message
                    db.Messages.Add(new PersistentMessage
                    {
                        Id = Guid.NewGuid(),
                        SessionId = persistentSession.Id,
                        Role = "user",
                        Content = userMessage,
                        IsAiGenerated = false,
                        Timestamp = DateTime.UtcNow
                    });

                    // Append assistant message
                    db.Messages.Add(new PersistentMessage
                    {
                        Id = Guid.NewGuid(),
                        SessionId = persistentSession.Id,
                        Role = "assistant",
                        Content = aiResponse,
                        RelevantRemediesJson = relevantRemediesJson,
                        IsAiGenerated = true,
                        Timestamp = DateTime.UtcNow
                    });

                    await db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Persistence note (session {SessionId}): {Message}", sessionId, ex.Message);
                }
            });
        }

        public bool ClearSession(string sessionId)
        {
            var removed = _sessions.TryRemove(sessionId, out _);
            if (removed)
            {
                _logger.LogInformation("Explicitly cleared and freed memory for session {SessionId}", sessionId);
            }
            return removed;
        }

        public ChatSession? GetSession(string sessionId)
        {
            _sessions.TryGetValue(sessionId, out var session);
            return session;
        }

        public IReadOnlyList<ChatSession> GetAllSessions()
        {
            return _sessions.Values.OrderByDescending(s => s.LastActiveAt).ToList();
        }

        public async Task<IReadOnlyList<UserSessionSummaryDto>> GetUserSessionsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<EthnovetDbContext>();

                var sessions = await db.Sessions
                    .Where(s => s.UserId == userId)
                    .OrderByDescending(s => s.LastActiveAt)
                    .Select(s => new UserSessionSummaryDto
                    {
                        Id = s.Id,
                        SessionId = s.SessionId,
                        Title = s.Title,
                        Animal = s.PersistedAnimal,
                        Language = s.PersistedLanguage,
                        CreatedAt = s.CreatedAt,
                        LastActiveAt = s.LastActiveAt,
                        MessageCount = s.Messages.Count
                    })
                    .ToListAsync(cancellationToken);

                return sessions;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to query user sessions for {UserId}: {Message}", userId, ex.Message);
                return Array.Empty<UserSessionSummaryDto>();
            }
        }

        public async Task<UserSessionDetailDto?> GetUserSessionDetailAsync(Guid userId, string sessionId, CancellationToken cancellationToken = default)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<EthnovetDbContext>();

                var session = await db.Sessions
                    .Include(s => s.Messages)
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SessionId == sessionId, cancellationToken);

                if (session == null) return null;

                return new UserSessionDetailDto
                {
                    Id = session.Id,
                    SessionId = session.SessionId,
                    Title = session.Title,
                    Animal = session.PersistedAnimal,
                    Language = session.PersistedLanguage,
                    CreatedAt = session.CreatedAt,
                    LastActiveAt = session.LastActiveAt,
                    Messages = session.Messages.OrderBy(m => m.Timestamp).Select(m => new UserSessionMessageDto
                    {
                        Id = m.Id,
                        Role = m.Role,
                        Content = m.Content,
                        RelevantRemediesJson = m.RelevantRemediesJson,
                        IsAiGenerated = m.IsAiGenerated,
                        Timestamp = m.Timestamp
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to query session detail for {SessionId}: {Message}", sessionId, ex.Message);
                return null;
            }
        }

        public async Task<bool> DeleteUserSessionAsync(Guid userId, string sessionId, CancellationToken cancellationToken = default)
        {
            try
            {
                _sessions.TryRemove(sessionId, out _);

                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<EthnovetDbContext>();

                var session = await db.Sessions
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.SessionId == sessionId, cancellationToken);

                if (session == null) return false;

                db.Sessions.Remove(session);
                await db.SaveChangesAsync(cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to delete session {SessionId}: {Message}", sessionId, ex.Message);
                return false;
            }
        }

        private void EvictExpiredSessions(object? state)
        {
            var cutoff = DateTime.UtcNow - _expirationWindow;
            int count = 0;

            foreach (var (id, session) in _sessions)
            {
                if (session.LastActiveAt < cutoff)
                {
                    if (_sessions.TryRemove(id, out _))
                    {
                        count++;
                    }
                }
            }

            if (count > 0)
            {
                _logger.LogInformation("Evicted {Count} expired in-memory chat sessions to free RAM.", count);
            }
        }

        public void Dispose()
        {
            _cleanupTimer?.Dispose();
        }
    }
}

