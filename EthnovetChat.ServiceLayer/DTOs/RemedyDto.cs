using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.ServiceLayer.DTOs
{
    public class RemedyDto
    {
        public int Id { get; set; }
        public string Disease { get; set; } = string.Empty;
        public string Animal { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string Treatment { get; set; } = string.Empty;
        public string Ingredients { get; set; } = string.Empty;

        public static RemedyDto FromEntity(EthnovetRemedy remedy) => new()
        {
            Id = remedy.Id,
            Disease = remedy.Disease,
            Animal = remedy.Animal,
            Symptoms = remedy.Symptoms,
            Treatment = remedy.Treatment,
            Ingredients = remedy.Ingredients
        };
    }
}

