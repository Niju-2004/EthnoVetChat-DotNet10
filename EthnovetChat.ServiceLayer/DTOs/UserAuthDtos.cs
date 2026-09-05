using System.ComponentModel.DataAnnotations;

namespace EthnovetChat.ServiceLayer.DTOs
{
    public class RegisterRequestDto
    {
        [Required]
        [MinLength(3)]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(5)]
        public string PreferredLanguage { get; set; } = "en";
    }

    public class LoginRequestDto
    {
        [Required]
        public string EmailOrUsername { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "Farmer";
        public string PreferredLanguage { get; set; } = "en";
        public DateTime CreatedAt { get; set; }
    }

    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string? Token { get; set; }
        public UserDto? User { get; set; }
        public string? Message { get; set; }
    }

    public class UpdateLanguageDto
    {
        [Required]
        [MaxLength(5)]
        public string Language { get; set; } = "en";
    }

    public class UserSessionSummaryDto
    {
        public Guid Id { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Animal { get; set; }
        public string Language { get; set; } = "en";
        public DateTime CreatedAt { get; set; }
        public DateTime LastActiveAt { get; set; }
        public int MessageCount { get; set; }
    }

    public class UserSessionDetailDto
    {
        public Guid Id { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Animal { get; set; }
        public string Language { get; set; } = "en";
        public DateTime CreatedAt { get; set; }
        public DateTime LastActiveAt { get; set; }
        public List<UserSessionMessageDto> Messages { get; set; } = new();
    }

    public class UserSessionMessageDto
    {
        public Guid Id { get; set; }
        public string Role { get; set; } = "user";
        public string Content { get; set; } = string.Empty;
        public string? RelevantRemediesJson { get; set; }
        public bool IsAiGenerated { get; set; }
        public DateTime Timestamp { get; set; }
    }
}

