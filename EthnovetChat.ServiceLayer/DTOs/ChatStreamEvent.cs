namespace EthnovetChat.ServiceLayer.DTOs
{
    public class ChatStreamEvent
    {
        public string EventType { get; set; } = string.Empty; // "meta", "token", "done", "error"
        public string? Token { get; set; }
        public string? SessionId { get; set; }
        public string? DetectedAnimal { get; set; }
        public string? Language { get; set; }
        public List<RemedyDto>? RelevantRemedies { get; set; }
        public bool IsAiGenerated { get; set; }
    }
}
