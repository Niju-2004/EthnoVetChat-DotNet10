using System.Text;
using System.Text.RegularExpressions;
using EthnovetChat.DataAccessLayer.Models;
using EthnovetChat.DataAccessLayer.Repositories;

namespace EthnovetChat.ServiceLayer.Services
{
    public class RagService : IRagService
    {
        private readonly IEthnovetRepository _repository;

        // Tamil and English animal keywords mapping
        private static readonly Dictionary<string, string[]> AnimalKeywords = new(StringComparer.OrdinalIgnoreCase)
        {
            ["cow"] = new[] { "cow", "cows", "cattle", "bull", "ox", "heifer", "calf", "buffalo", "dairy", "மாடு", "மாட்டுக்கு", "மாட்டு", "பசுவுக்கு", "பசு", "காளை", "கன்று", "கன்றுக்கு", "கன்றுக்குட்டி", "எருமை" },
            ["goat"] = new[] { "goat", "goats", "sheep", "sheeps", "lamb", "kid", "ram", "ஆடு", "ஆட்டுக்கு", "ஆட்டு", "வெள்ளாடு", "செம்மறி", "செம்மறியாடு" },
            ["poultry"] = new[] { "chicken", "chickens", "hen", "rooster", "poultry", "bird", "birds", "duck", "turkey", "கோழி", "கோழிக்கு", "வாத்து", "வான்கோழி" },
            ["dog"] = new[] { "dog", "dogs", "puppy", "hound", "நாய்", "நாய்க்கு", "நாய்க்குட்டி" }
        };

        // Tamil symptom terms mapped to English ethnovet search keywords
        private static readonly Dictionary<string, string> TamilToEnglishSymptomMap = new()
        {
            ["உப்பசம்"] = "tympani stomach bulged breathing",
            ["வயிறு உப்பசம்"] = "tympani stomach bulged",
            ["வயிற்றுப்போக்கு"] = "diarrhea watery dung",
            ["கழிச்சல்"] = "diarrhea scour",
            ["பேதி"] = "diarrhea",
            ["தீவனம்"] = "off feed anorexia indigestion",
            ["அசை"] = "rumination digestive",
            ["செரிமானம்"] = "indigestion digestive",
            ["மடி நோய்"] = "mastitis swollen udder",
            ["கோமாரி"] = "foot and mouth ulcers hooves saliva",
            ["காய்ச்சல்"] = "fever shivering recumbent",
            ["புண்"] = "wounds",
            ["காயம்"] = "wounds injuries",
            ["புழு"] = "maggot worms endoparasites",
            ["குடற்புழு"] = "endoparasites intestinal worms",
            ["பேன்"] = "lice ectoparasites",
            ["உண்ணி"] = "ticks mites ectoparasites",
            ["சளி"] = "respiratory breathing snoring",
            ["இருமல்"] = "respiratory",
            ["எலும்பு முறிவு"] = "fracture broken leg",
            ["கொம்பு"] = "horn fracture",
            ["பால்"] = "increase milk deficiency",
            ["கருத்தரிக்க"] = "infertility repeat breeding",
            ["நஞ்சுக்கொடி"] = "retention placenta",
            ["நச்சுக்கொடி"] = "retention placenta",
            ["கருப்பை"] = "uterus prolapse"
        };

        public RagService(IEthnovetRepository repository)
        {
            _repository = repository;
        }

        public async Task<IReadOnlyList<EthnovetRemedy>> RetrieveRelevantRemediesAsync(
            string query,
            string? animal = null,
            int topK = 3,
            CancellationToken cancellationToken = default)
        {
            var detectedAnimal = DetectAnimal(query, animal);

            // Expand query with Tamil symptom concepts if present
            var expandedQuery = query;
            foreach (var (tamilTerm, englishTerms) in TamilToEnglishSymptomMap)
            {
                if (query.Contains(tamilTerm, StringComparison.OrdinalIgnoreCase))
                {
                    expandedQuery += " " + englishTerms;
                }
            }

            var filter = new SearchFilter
            {
                Query = expandedQuery,
                Animal = detectedAnimal,
                Limit = topK
            };

            var results = await _repository.SearchAsync(filter, cancellationToken);

            // Fallback: If no results with animal filter, search across all remedies ONLY if query has valid terms
            if (results.Count == 0 && !string.IsNullOrWhiteSpace(detectedAnimal))
            {
                filter.Animal = null;
                results = await _repository.SearchAsync(filter, cancellationToken);
            }

            return results;
        }

        public string FormatRagContext(IReadOnlyList<EthnovetRemedy> remedies)
        {
            if (remedies == null || remedies.Count == 0)
                return "No specific ethnoveterinary remedies found in the dataset.";

            var sb = new StringBuilder();
            sb.AppendLine("=== VERIFIED ETHNOVETERINARY PRACTICES KNOWLEDGE BASE ===");
            for (int i = 0; i < remedies.Count; i++)
            {
                var r = remedies[i];
                sb.AppendLine($"[Remedy #{r.Id + 1}]");
                sb.AppendLine($"Disease / Condition: {r.Disease}");
                sb.AppendLine($"Target Animal(s): {r.Animal}");
                if (!string.IsNullOrWhiteSpace(r.Symptoms))
                {
                    sb.AppendLine($"Symptoms: {r.Symptoms}");
                }
                sb.AppendLine($"Ingredients: {r.Ingredients}");
                sb.AppendLine($"Preparation & Treatment: {r.Treatment}");
                sb.AppendLine("--------------------------------------------------");
            }

            return sb.ToString();
        }

        public string? DetectAnimal(string query, string? preferredAnimal = null)
        {
            if (!string.IsNullOrWhiteSpace(preferredAnimal))
            {
                return NormalizeAnimal(preferredAnimal);
            }

            var text = query.ToLowerInvariant();
            foreach (var (canonical, keywords) in AnimalKeywords)
            {
                foreach (var kw in keywords)
                {
                    if (kw.Any(c => c > 127))
                    {
                        if (text.Contains(kw))
                            return canonical;
                    }
                    else
                    {
                        if (Regex.IsMatch(text, $@"\b{Regex.Escape(kw)}\b", RegexOptions.IgnoreCase))
                            return canonical;
                    }
                }
            }

            return null;
        }

        public string DetectLanguage(string text, string? requestedLanguage = null)
        {
            // First check if text contains Tamil characters (Unicode block U+0B80 to U+0BFF)
            if (!string.IsNullOrWhiteSpace(text) && Regex.IsMatch(text, @"[\u0B80-\u0BFF]"))
            {
                return "ta";
            }

            if (!string.IsNullOrWhiteSpace(requestedLanguage))
            {
                var req = requestedLanguage.Trim().ToLowerInvariant();
                if (req.StartsWith("ta") || req.Contains("tamil") || req.Contains("தமிழ்"))
                    return "ta";
                if (req.StartsWith("en") || req.Contains("english"))
                    return "en";
            }

            return "en";
        }

        private static readonly HashSet<string> GreetingPhrases = new(StringComparer.OrdinalIgnoreCase)
        {
            "hi", "hello", "hey", "howdy", "greetings", "good morning", "good evening", "good afternoon",
            "morning", "evening", "help", "who are you", "what can you do", "hi there", "hello there",
            "வணக்கம்", "காலை வணக்கம்", "மாலை வணக்கம்", "நலமா", "ஹலோ", "வணக்கமுங்க", "வணக்கம் ஐயா",
            "வணக்கம் அய்யா", "வணக்கம் எத்னோவெட்"
        };

        private static readonly string[] MedicalKeywordsEn = new[]
        {
            "vomit", "vomitting", "vomiting", "diarrhea", "diarrhoea", "dung", "scour", "scours", "bloat",
            "bloated", "tympani", "cough", "coughing", "fever", "shiver", "shivering", "wound", "wounds",
            "injury", "injuries", "cut", "cuts", "bleeding", "off-feed", "off feed", "anorexia", "indigestion",
            "eating", "eats", "ate", "appetite", "rumination", "chewing the cud", "mastitis", "udder", "teat",
            "milk", "foot", "mouth", "ulcer", "ulcers", "saliva", "salivation", "maggot", "maggots", "worm",
            "worms", "endoparasites", "lice", "tick", "ticks", "mite", "mites", "ectoparasites", "snore",
            "snoring", "fracture", "broken", "horn", "infertility", "breeding", "placenta", "uterus", "prolapse",
            "swelling", "swollen", "pain", "limp", "limping", "lethargic", "dull", "eyes", "eye", "skin",
            "itching", "itch", "scratching", "fur", "hair", "poison", "toxin", "toxic", "dosage", "dose",
            "medicine", "remedy", "treatment", "cure", "heal", "treat", "sick", "ill", "disease", "problem",
            "problems", "issues", "scabies", "mange", "infection", "infections", "loose motion", "watery", "dropsy",
            "cold", "chills", "weak", "weakness"
        };

        private static readonly string[] MedicalKeywordsTa = new[]
        {
            "உப்பசம்", "வயிற்றுப்போக்கு", "கழிச்சல்", "பேதி", "தீவனம்", "அசை", "செரிமானம்", "மடி நோய்",
            "கோமாரி", "காய்ச்சல்", "புண்", "காயம்", "புழு", "குடற்புழு", "பேன்", "உண்ணி", "சளி", "இருமல்",
            "எலும்பு முறிவு", "கொம்பு", "பால்", "கருத்தரிக்க", "நஞ்சுக்கொடி", "நச்சுக்கொடி", "கருப்பை",
            "வாந்தி", "சாப்பிடல", "சாப்பிடவில்லை", "சாப்பிட மாட்டேங்குது", "சாப்பாடு", "நீர் போன்ற சாணம்",
            "நோய்", "மருந்து", "சிகிச்சை", "குணமாக", "வீக்கம்", "வலி", "தோல்", "அரிப்பு", "முறிந்தது", "மயக்கம்"
        };

        public ChatIntent DetectIntent(string query, string? detectedAnimal, bool hasPriorMedicalContext = false)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return ChatIntent.Greeting;
            }

            var clean = query.Trim().TrimEnd('.', '!', '?', ',');
            var lower = clean.ToLowerInvariant();

            // 1. Check for pure greeting
            if (GreetingPhrases.Contains(clean) || GreetingPhrases.Contains(lower))
            {
                return ChatIntent.Greeting;
            }

            if (Regex.IsMatch(clean, @"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day))(\s+(there|assistant|bot|friend))?[\s!.,?]*$", RegexOptions.IgnoreCase))
            {
                return ChatIntent.Greeting;
            }

            // 2. Check for presence of clinical / medical symptoms
            bool hasMedicalKeywords = MedicalKeywordsEn.Any(k => Regex.IsMatch(lower, $@"\b{Regex.Escape(k)}\b", RegexOptions.IgnoreCase))
                || MedicalKeywordsTa.Any(k => lower.Contains(k, StringComparison.OrdinalIgnoreCase))
                || TamilToEnglishSymptomMap.Keys.Any(k => lower.Contains(k, StringComparison.OrdinalIgnoreCase));

            if (hasMedicalKeywords)
            {
                return ChatIntent.MedicalQuery;
            }

            // If user is asking a follow-up in an ongoing medical conversation (e.g. "how much dosage?", "twice a day?")
            if (hasPriorMedicalContext && (lower.Contains("dosage") || lower.Contains("dose") || lower.Contains("quantity") || lower.Contains("times") || lower.Contains("days") || lower.Contains("how") || lower.Contains("what") || lower.Contains("safe") || lower.Contains("அளவு") || lower.Contains("எப்படி")))
            {
                return ChatIntent.MedicalQuery;
            }

            // 3. Check for Animal-Only declaration (e.g. "I have a dog", "ihave one dog", "my cow", "மாடு இருக்கு", "என் நாய்")
            var animal = detectedAnimal ?? DetectAnimal(query);
            if (!string.IsNullOrWhiteSpace(animal))
            {
                // Remove filler words to see if anything medical remains
                var stripped = Regex.Replace(lower, @"\b(i|we|you|he|she|they|have|has|had|got|ihave|i've|we've|one|two|three|a|an|the|my|our|there|is|are|keep|raising|raise|own|pet|animal|farm|at|home|in|dog|dogs|puppy|cow|cows|cattle|calf|calves|goat|goats|sheep|lamb|chicken|chickens|poultry|hen)\b", "", RegexOptions.IgnoreCase);
                stripped = Regex.Replace(stripped, @"[\s.,!?;:]+", "");

                // Tamil filler words removal
                stripped = stripped
                    .Replace("என்னிடம்", "")
                    .Replace("ஒரு", "")
                    .Replace("உள்ளது", "")
                    .Replace("இருக்கு", "")
                    .Replace("என்", "")
                    .Replace("வளர்க்கிறேன்", "")
                    .Replace("வச்சிருக்கேன்", "")
                    .Replace("மாடு", "")
                    .Replace("பசு", "")
                    .Replace("ஆடு", "")
                    .Replace("கோழி", "")
                    .Replace("நாய்", "")
                    .Replace("கன்று", "");

                if (string.IsNullOrWhiteSpace(stripped) || stripped.Length < 3)
                {
                    return ChatIntent.AnimalOnly;
                }
            }

            // If the query is very short and contains no medical terms, treat as general inquiry
            return hasPriorMedicalContext ? ChatIntent.MedicalQuery : ChatIntent.GeneralInquiry;
        }

        private static string NormalizeAnimal(string animal)
        {
            var a = animal.Trim().ToLowerInvariant();
            foreach (var (canonical, keywords) in AnimalKeywords)
            {
                if (keywords.Contains(a))
                    return canonical;
            }
            return a;
        }
    }
}
