using System.Collections.Concurrent;
using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.ServiceLayer.Services
{
    public class SessionService : ISessionService, IDisposable
    {
        private readonly ConcurrentDictionary<string, ChatSession> _sessions = new();
        private readonly TimeSpan _expirationWindow = TimeSpan.FromHours(1);
        private readonly Timer _cleanupTimer;
        private readonly ILogger<SessionService> _logger;

        public SessionService(ILogger<SessionService> logger)
        {
            _logger = logger;
            // Run session cleanup every 15 minutes
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

        public void RecordTurn(string sessionId, string userMessage, string aiResponse, string? animal, string language)
        {
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

            // Append user message
            session.Messages.Add(new ChatMessage
            {
                Role = "user",
                Content = userMessage,
                Timestamp = DateTime.UtcNow
            });

            // Append AI response
            session.Messages.Add(new ChatMessage
            {
                Role = "model",
                Content = aiResponse,
                Timestamp = DateTime.UtcNow
            });

            // Keep only the last 20 messages in storage to bound memory
            if (session.Messages.Count > 20)
            {
                session.Messages = session.Messages.Skip(session.Messages.Count - 20).ToList();
            }
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
                _logger.LogInformation("Evicted {Count} expired chat sessions to free memory.", count);
            }
        }

        public void Dispose()
        {
            _cleanupTimer?.Dispose();
        }
    }
}

