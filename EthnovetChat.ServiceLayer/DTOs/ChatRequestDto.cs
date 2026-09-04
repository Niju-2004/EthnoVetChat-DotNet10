using System.ComponentModel.DataAnnotations;

namespace EthnovetChat.ServiceLayer.DTOs
{
    public class ChatRequestDto
    {
        [Required(ErrorMessage = "Message is required.")]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Optional animal filter (e.g., "cow", "goat", "poultry", "dog")
        /// </summary>
        public string? Animal { get; set; }

        /// <summary>
        /// Requested language: "en" for English, "ta" for Tamil (or auto-detected from query)
        /// </summary>
        public string? Language { get; set; }

        /// <summary>
        /// Optional session identifier for conversational continuity
        /// </summary>
        public string? SessionId { get; set; }
    }
}
