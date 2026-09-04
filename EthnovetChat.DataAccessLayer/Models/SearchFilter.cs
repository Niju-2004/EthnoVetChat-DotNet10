namespace EthnovetChat.DataAccessLayer.Models
{
    public class SearchFilter
    {
        public string? Query { get; set; }
        public string? Animal { get; set; }
        public string? Disease { get; set; }
        public int Limit { get; set; } = 5;
    }
}

