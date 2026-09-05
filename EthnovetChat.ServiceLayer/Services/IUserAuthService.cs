using EthnovetChat.ServiceLayer.DTOs;

namespace EthnovetChat.ServiceLayer.Services
{
    public interface IUserAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
        Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<bool> UpdatePreferredLanguageAsync(Guid userId, string language, CancellationToken cancellationToken = default);
        Guid? ValidateTokenAndGetUserId(string? token);
    }
}

