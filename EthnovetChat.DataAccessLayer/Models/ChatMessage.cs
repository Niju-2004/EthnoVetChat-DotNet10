namespace EthnovetChat.DataAccessLayer.Models
{
    public class ChatMessage
    {
        public string Role { get; set; } = "user"; // "user" or "model"
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}

