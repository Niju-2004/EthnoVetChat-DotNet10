using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.ServiceLayer.Services
{
    public interface IGeminiService
    {
        bool IsConfigured { get; }
        Task<string> GenerateResponseAsync(
            string systemInstruction,
            IReadOnlyList<ChatMessage> history,
            string currentPrompt,
            CancellationToken cancellationToken = default);

        IAsyncEnumerable<string> StreamResponseAsync(
            string systemInstruction,
            IReadOnlyList<ChatMessage> history,
            string currentPrompt,
            CancellationToken cancellationToken = default);
    }
}

