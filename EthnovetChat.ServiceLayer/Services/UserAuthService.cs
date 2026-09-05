using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using EthnovetChat.DataAccessLayer.Data;
using EthnovetChat.DataAccessLayer.Models;
using EthnovetChat.ServiceLayer.DTOs;

namespace EthnovetChat.ServiceLayer.Services
{
    public class UserAuthService : IUserAuthService
    {
        private readonly EthnovetDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly ILogger<UserAuthService> _logger;
        private readonly byte[] _jwtKey;

        public UserAuthService(
            EthnovetDbContext dbContext,
            IConfiguration configuration,
            ILogger<UserAuthService> logger)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _logger = logger;

            var secret = _configuration["Jwt:Secret"] ?? "EthnoVetChat_NeonPostgres_SuperSecretJwtSecurityKey_2026";
            _jwtKey = Encoding.UTF8.GetBytes(secret.PadRight(32));
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
        {
            var cleanUsername = request.Username.Trim();
            var cleanEmail = request.Email.Trim().ToLowerInvariant();

            // Check if username already exists
            if (await _dbContext.Users.AnyAsync(u => u.Username.ToLower() == cleanUsername.ToLower(), cancellationToken))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Username is already taken. Please choose another."
                };
            }

            // Check if email already exists
            if (await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == cleanEmail, cancellationToken))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "An account with this email already exists."
                };
            }

            var passwordHash = HashPassword(request.Password);
            var lang = string.Equals(request.PreferredLanguage, "ta", StringComparison.OrdinalIgnoreCase) ? "ta" : "en";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = cleanUsername,
                Email = cleanEmail,
                PasswordHash = passwordHash,
                Role = "Farmer",
                PreferredLanguage = lang,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("New farmer registered: {Username} ({Email}) with lang={Lang}", user.Username, user.Email, user.PreferredLanguage);

            var token = GenerateJwtToken(user);
            return new AuthResponseDto
            {
                Success = true,
                Token = token,
                User = MapToDto(user),
                Message = "Registration successful."
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
        {
            var identifier = request.EmailOrUsername.Trim().ToLowerInvariant();
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier, cancellationToken);

            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid username/email or password."
                };
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            var token = GenerateJwtToken(user);
            return new AuthResponseDto
            {
                Success = true,
                Token = token,
                User = MapToDto(user),
                Message = "Login successful."
            };
        }

        public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            return user != null ? MapToDto(user) : null;
        }

        public async Task<bool> UpdatePreferredLanguageAsync(Guid userId, string language, CancellationToken cancellationToken = default)
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null) return false;

            user.PreferredLanguage = string.Equals(language, "ta", StringComparison.OrdinalIgnoreCase) ? "ta" : "en";
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Updated preferred language for user {UserId} to {Lang}", userId, user.PreferredLanguage);
            return true;
        }

        public Guid? ValidateTokenAndGetUserId(string? token)
        {
            if (string.IsNullOrWhiteSpace(token)) return null;

            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring(7).Trim();
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(_jwtKey),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    return userId;
                }
            }
            catch
            {
                // Invalid or expired token
            }

            return null;
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity([
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role),
                    new Claim("preferred_language", user.PreferredLanguage)
                ]),
                Expires = DateTime.UtcNow.AddDays(30), // 30-day token for farmer convenience
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(_jwtKey), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private static string HashPassword(string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(16);
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                iterations: 100_000,
                hashAlgorithm: HashAlgorithmName.SHA256,
                outputLength: 32);

            return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        private static bool VerifyPassword(string password, string storedHash)
        {
            var parts = storedHash.Split('.');
            if (parts.Length != 2) return false;

            byte[] salt = Convert.FromBase64String(parts[0]);
            byte[] expectedHash = Convert.FromBase64String(parts[1]);

            byte[] actualHash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                iterations: 100_000,
                hashAlgorithm: HashAlgorithmName.SHA256,
                outputLength: 32);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        private static UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                PreferredLanguage = user.PreferredLanguage,
                CreatedAt = user.CreatedAt
            };
        }
    }
}

