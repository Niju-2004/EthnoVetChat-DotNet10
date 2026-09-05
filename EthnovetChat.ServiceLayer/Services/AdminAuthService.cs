using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace EthnovetChat.ServiceLayer.Services
{
    public class AdminAuthService : IAdminAuthService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AdminAuthService> _logger;
        private readonly byte[] _hmacKey;
        private readonly ConcurrentDictionary<string, FailedAttemptRecord> _failedAttempts = new();

        public AdminAuthService(IConfiguration configuration, ILogger<AdminAuthService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            var secret = _configuration["Admin:SecretKey"] ?? _configuration["ADMIN_SECRET"];
            if (string.IsNullOrWhiteSpace(secret))
            {
                _hmacKey = RandomNumberGenerator.GetBytes(32);
            }
            else
            {
                _hmacKey = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
            }
        }

        public (bool Success, string? Token, DateTime? ExpiresAt, string? ErrorMessage) Authenticate(string password, string clientIp)
        {
            var now = DateTime.UtcNow;
            if (_failedAttempts.TryGetValue(clientIp, out var record))
            {
                if (record.LockedUntil > now)
                {
                    var remaining = Math.Ceiling((record.LockedUntil - now).TotalMinutes);
                    _logger.LogWarning("Admin login locked out for IP {Ip}. Try again in {Mins} mins", clientIp, remaining);
                    return (false, null, null, $"Too many failed login attempts. Account locked for {remaining} more minute(s).");
                }
            }

            var configuredPassword = _configuration["Admin:Password"] ??
                                     _configuration["ADMIN_PASSWORD"] ??
                                     "ethnovet@admin2026";

            if (string.IsNullOrWhiteSpace(password) || password != configuredPassword)
            {
                var updated = _failedAttempts.AddOrUpdate(clientIp,
                    new FailedAttemptRecord { Count = 1, LastAttempt = now },
                    (key, existing) =>
                    {
                        existing.Count++;
                        existing.LastAttempt = now;
                        if (existing.Count >= 5)
                        {
                            existing.LockedUntil = now.AddMinutes(10);
                        }
                        return existing;
                    });

                if (updated.Count >= 5)
                {
                    return (false, null, null, "Too many failed attempts. Locked for 10 minutes.");
                }

                return (false, null, null, $"Invalid admin credentials. {5 - updated.Count} attempt(s) remaining.");
            }

            _failedAttempts.TryRemove(clientIp, out _);

            var expiresAt = now.AddHours(8);
            var payload = $"{now.Ticks}:{expiresAt.Ticks}";
            using var hmac = new HMACSHA256(_hmacKey);
            var signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var signature = Convert.ToBase64String(signatureBytes);
            var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{payload}:{signature}"));

            _logger.LogInformation("Admin authenticated successfully from IP {Ip}", clientIp);
            return (true, token, expiresAt, null);
        }

        public bool ValidateToken(string? token)
        {
            if (string.IsNullOrWhiteSpace(token)) return false;

            try
            {
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(token));
                var parts = decoded.Split(':');
                if (parts.Length != 3) return false;

                if (!long.TryParse(parts[0], out var issuedTicks) || !long.TryParse(parts[1], out var expiryTicks))
                {
                    return false;
                }

                var expiresAt = new DateTime(expiryTicks, DateTimeKind.Utc);
                if (DateTime.UtcNow > expiresAt)
                {
                    return false;
                }

                var payload = $"{issuedTicks}:{expiryTicks}";
                using var hmac = new HMACSHA256(_hmacKey);
                var expectedSig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

                return CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(parts[2]),
                    Encoding.UTF8.GetBytes(expectedSig));
            }
            catch
            {
                return false;
            }
        }

        private class FailedAttemptRecord
        {
            public int Count { get; set; }
            public DateTime LastAttempt { get; set; }
            public DateTime LockedUntil { get; set; }
        }
    }
}
