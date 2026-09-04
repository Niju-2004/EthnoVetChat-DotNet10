using System.Text.Json.Serialization;

namespace EthnovetChat.DataAccessLayer.Models
{
    public class EthnovetRemedy
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("disease")]
        public string Disease { get; set; } = string.Empty;

        [JsonPropertyName("animal")]
        public string Animal { get; set; } = string.Empty;

        [JsonPropertyName("symptoms")]
        public string Symptoms { get; set; } = string.Empty;

        [JsonPropertyName("treatment")]
        public string Treatment { get; set; } = string.Empty;

        [JsonPropertyName("ingredients")]
        public string Ingredients { get; set; } = string.Empty;

        public bool MatchesAnimal(string? targetAnimal)
        {
            if (string.IsNullOrWhiteSpace(targetAnimal))
                return true;

            if (string.IsNullOrWhiteSpace(Animal))
                return true; // applies universally if unspecified

            var target = targetAnimal.Trim().ToLowerInvariant();
            var current = Animal.ToLowerInvariant();

            // Map common aliases
            if (target is "cow" or "cattle" or "ox" or "bull" or "bullock" or "heifer")
            {
                return current.Contains("cow") || current.Contains("cattle") || current.Contains("calf") || current.Contains("buffalo") || current.Contains("dairy");
            }

            if (target is "goat" or "sheeps" or "sheep" or "lamb" or "kid")
            {
                return current.Contains("goat") || current.Contains("sheep") || current.Contains("sheeps");
            }

            if (target is "chicken" or "chickens" or "poultry" or "bird" or "birds" or "hen" or "rooster" or "duck" or "turkey")
            {
                return current.Contains("chicken") || current.Contains("poultry") || current.Contains("bird") || current.Contains("duck") || current.Contains("turkey");
            }

            if (target is "dog" or "dogs" or "puppy")
            {
                return current.Contains("dog");
            }

            return current.Contains(target);
        }

        public string GetSearchableText()
        {
            return $"{Disease} {Animal} {Symptoms} {Ingredients} {Treatment}".ToLowerInvariant();
        }
    }
}

