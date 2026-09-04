namespace EthnovetChat.ServiceLayer.DTOs
{
    public class ChatResponseDto
    {
        public string Answer { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public List<RemedyDto> RelevantRemedies { get; set; } = new();
        public bool IsAiGenerated { get; set; }
        public string? SessionId { get; set; }
        public string? DetectedAnimal { get; set; }
    }
}

