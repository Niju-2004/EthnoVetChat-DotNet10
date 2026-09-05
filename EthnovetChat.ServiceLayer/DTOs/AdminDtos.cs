using EthnovetChat.ServiceLayer.DTOs;

namespace EthnovetChat.ServiceLayer.DTOs
{
    public class AdminLoginRequest
    {
        public string Password { get; set; } = string.Empty;
    }

    public class AdminLoginResponse
    {
        public bool Success { get; set; }
        public string? Token { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Message { get; set; }
    }

    public class AdminAnalyticsDto
    {
        public int TotalRemedies { get; set; }
        public int TotalRegisteredUsers { get; set; }
        public int TotalActiveSessions { get; set; }
        public int TotalMessagesRecorded { get; set; }
        public Dictionary<string, int> QueriesByAnimal { get; set; } = new();
        public Dictionary<string, int> QueriesByLanguage { get; set; } = new();
        public List<DiseaseStatDto> TopDiseases { get; set; } = new();
    }

    public class DiseaseStatDto
    {
        public string Disease { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class AdminSessionSummaryDto
    {
        public string SessionId { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public string? Username { get; set; }
        public string? UserEmail { get; set; }
        public string? UserRole { get; set; }
        public string Title { get; set; } = "New Consultation";
        public DateTime CreatedAt { get; set; }
        public DateTime LastActiveAt { get; set; }
        public string? PersistedAnimal { get; set; }
        public string PersistedLanguage { get; set; } = "en";
        public int MessageCount { get; set; }
        public List<AdminMessageDto> RecentMessages { get; set; } = new();
    }

    public class AdminMessageDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class AiConfigDto
    {
        public string ActiveModel { get; set; } = "gemini-3.1-flash-lite";
        public int MaxOutputTokens { get; set; } = 800;
        public double Temperature { get; set; } = 0.2;
        public bool IsGeminiConfigured { get; set; }
        public List<string> AvailableModels { get; set; } = new();
    }

    public class CreateRemedyRequest
    {
        public string Disease { get; set; } = string.Empty;
        public string Animal { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string Ingredients { get; set; } = string.Empty;
        public string Treatment { get; set; } = string.Empty;
    }

    public class UpdateRemedyRequest
    {
        public string Disease { get; set; } = string.Empty;
        public string Animal { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string Ingredients { get; set; } = string.Empty;
        public string Treatment { get; set; } = string.Empty;
    }
}
