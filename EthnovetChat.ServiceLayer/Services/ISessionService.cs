using EthnovetChat.DataAccessLayer.Models;
using EthnovetChat.ServiceLayer.DTOs;

namespace EthnovetChat.ServiceLayer.Services
{
    public interface ISessionService
    {
        ChatSession GetOrCreateSession(string? sessionId);
        IReadOnlyList<ChatMessage> GetRollingHistory(string sessionId, int maxTurns = 5);
        void RecordTurn(string sessionId, string userMessage, string aiResponse, string? animal, string language, Guid? userId = null, string? relevantRemediesJson = null);
        bool ClearSession(string sessionId);
        ChatSession? GetSession(string sessionId);
        IReadOnlyList<ChatSession> GetAllSessions();
        Task<IReadOnlyList<UserSessionSummaryDto>> GetUserSessionsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<UserSessionDetailDto?> GetUserSessionDetailAsync(Guid userId, string sessionId, CancellationToken cancellationToken = default);
        Task<bool> DeleteUserSessionAsync(Guid userId, string sessionId, CancellationToken cancellationToken = default);
    }
}

