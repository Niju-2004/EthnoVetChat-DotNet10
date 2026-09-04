using System.Reflection;
using System.Text.Json;
using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.DataAccessLayer.Repositories
{
    public class EthnovetRepository : IEthnovetRepository
    {
        private static readonly Lazy<List<EthnovetRemedy>> _remedies = new(LoadDataset);

        private static List<EthnovetRemedy> LoadDataset()
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            // 1. Try loading from file path in AppContext.BaseDirectory
            var localPath = Path.Combine(AppContext.BaseDirectory, "Data", "ethnovet_dataset.json");
            if (File.Exists(localPath))
            {
                var json = File.ReadAllText(localPath);
                var items = JsonSerializer.Deserialize<List<EthnovetRemedy>>(json, options);
                if (items != null && items.Count > 0)
                {
                    return items;
                }
            }

            // 2. Try loading from embedded resource
            var assembly = typeof(EthnovetRepository).Assembly;
            var resourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(name => name.EndsWith("ethnovet_dataset.json", StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrEmpty(resourceName))
            {
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream != null)
                {
                    using var reader = new StreamReader(stream);
                    var json = reader.ReadToEnd();
                    var items = JsonSerializer.Deserialize<List<EthnovetRemedy>>(json, options);
                    if (items != null && items.Count > 0)
                    {
                        return items;
                    }
                }
            }

            return new List<EthnovetRemedy>();
        }

        public Task<IReadOnlyList<EthnovetRemedy>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            IReadOnlyList<EthnovetRemedy> list = _remedies.Value;
            return Task.FromResult(list);
        }

        public Task<EthnovetRemedy?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var remedy = _remedies.Value.FirstOrDefault(r => r.Id == id);
            return Task.FromResult(remedy);
        }

        public Task<IReadOnlyList<EthnovetRemedy>> SearchAsync(SearchFilter filter, CancellationToken cancellationToken = default)
        {
            var queryable = _remedies.Value.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(filter.Animal))
            {
                queryable = queryable.Where(r => r.MatchesAnimal(filter.Animal));
            }

            if (!string.IsNullOrWhiteSpace(filter.Disease))
            {
                queryable = queryable.Where(r => r.Disease.Contains(filter.Disease, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(filter.Query))
            {
                var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "is", "are", "was",
                    "were", "it", "my", "our", "their", "of", "from", "by", "has", "have", "had", "can",
                    "what", "how", "give", "please", "help", "tell", "me", "about", "i", "we", "you", "he",
                    "she", "they", "ihave", "i've", "one", "two", "some", "any", "animal", "pet",
                    // Common animal words (animal is filtered separately by filter.Animal)
                    "cow", "cows", "cattle", "calf", "calves", "bull", "ox", "heifer", "buffalo",
                    "goat", "goats", "sheep", "lamb", "kid", "ram",
                    "chicken", "chickens", "poultry", "hen", "rooster", "bird", "birds", "duck",
                    "dog", "dogs", "puppy", "hound",
                    "மாடு", "பசு", "ஆடு", "கோழி", "நாய்", "கன்று"
                };

                var terms = filter.Query
                    .Split(new[] { ' ', ',', '.', ';', '?', '!', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                    .Where(t => t.Length > 2 && !stopWords.Contains(t))
                    .Select(t => t.ToLowerInvariant())
                    .Distinct()
                    .ToList();

                if (terms.Count > 0)
                {
                    queryable = queryable
                        .Select(r => new
                        {
                            Remedy = r,
                            Score = CalculateScore(r, terms)
                        })
                        .Where(x => x.Score > 0)
                        .OrderByDescending(x => x.Score)
                        .Select(x => x.Remedy);
                }
                else
                {
                    // No valid symptom or medical terms in query (e.g. only greeting or "i have a dog")
                    // Do NOT return random remedies
                    return Task.FromResult<IReadOnlyList<EthnovetRemedy>>(new List<EthnovetRemedy>());
                }
            }

            var results = queryable.Take(filter.Limit > 0 ? filter.Limit : 5).ToList();
            return Task.FromResult<IReadOnlyList<EthnovetRemedy>>(results);
        }

        private static int CalculateScore(EthnovetRemedy remedy, List<string> terms)
        {
            int score = 0;
            var disease = remedy.Disease.ToLowerInvariant();
            var symptoms = remedy.Symptoms.ToLowerInvariant();
            var ingredients = remedy.Ingredients.ToLowerInvariant();
            var treatment = remedy.Treatment.ToLowerInvariant();

            foreach (var term in terms)
            {
                if (disease.Contains(term)) score += 6;
                if (symptoms.Contains(term)) score += 5;
                if (ingredients.Contains(term)) score += 2;
                if (treatment.Contains(term)) score += 1;
            }

            return score;
        }

        public Task<IReadOnlyList<string>> GetDistinctDiseasesAsync(CancellationToken cancellationToken = default)
        {
            var diseases = _remedies.Value
                .Select(r => r.Disease.Trim())
                .Where(d => !string.IsNullOrEmpty(d))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(d => d)
                .ToList();

            return Task.FromResult<IReadOnlyList<string>>(diseases);
        }

        public Task<IReadOnlyList<string>> GetDistinctAnimalsAsync(CancellationToken cancellationToken = default)
        {
            var animals = _remedies.Value
                .Select(r => r.Animal.Trim())
                .Where(a => !string.IsNullOrEmpty(a))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(a => a)
                .ToList();

            return Task.FromResult<IReadOnlyList<string>>(animals);
        }
    }
}

