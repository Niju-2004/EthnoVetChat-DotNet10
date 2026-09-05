using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.ServiceLayer.Services
{
    public interface ISessionService
    {
        ChatSession GetOrCreateSession(string? sessionId);
        IReadOnlyList<ChatMessage> GetRollingHistory(string sessionId, int maxTurns = 5);
        void RecordTurn(string sessionId, string userMessage, string aiResponse, string? animal, string language);
        bool ClearSession(string sessionId);
        ChatSession? GetSession(string sessionId);
        IReadOnlyList<ChatSession> GetAllSessions();
    }
}

