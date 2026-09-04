namespace EthnovetChat.DataAccessLayer.Models
{
    public class ChatSession
    {
        public string SessionId { get; set; } = Guid.NewGuid().ToString();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
        public string? PersistedAnimal { get; set; }
        public string? PersistedLanguage { get; set; }
        public List<ChatMessage> Messages { get; set; } = new();

        /// <summary>
        /// Returns the last N conversation turns (up to maxTurns * 2 messages: User + Model).
        /// </summary>
        public IReadOnlyList<ChatMessage> GetRecentHistory(int maxTurns = 5)
        {
            int maxMessages = maxTurns * 2;
            if (Messages.Count <= maxMessages)
            {
                return Messages.ToList();
            }

            return Messages.Skip(Messages.Count - maxMessages).ToList();
        }
    }
}

