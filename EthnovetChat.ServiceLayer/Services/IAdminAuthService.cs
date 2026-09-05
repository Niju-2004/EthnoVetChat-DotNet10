namespace EthnovetChat.ServiceLayer.Services
{
    public interface IAdminAuthService
    {
        (bool Success, string? Token, DateTime? ExpiresAt, string? ErrorMessage) Authenticate(string password, string clientIp);
        bool ValidateToken(string? token);
    }
}
