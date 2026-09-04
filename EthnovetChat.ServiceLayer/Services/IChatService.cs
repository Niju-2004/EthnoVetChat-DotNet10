using EthnovetChat.ServiceLayer.DTOs;

namespace EthnovetChat.ServiceLayer.Services
{
    public interface IChatService
    {
        Task<ChatResponseDto> ProcessChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default);
        IAsyncEnumerable<ChatStreamEvent> StreamChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default);
    }
}

