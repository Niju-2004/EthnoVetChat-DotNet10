using System.Text;
using System.Text.Json;
using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.ServiceLayer.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiService> _logger;

        private static readonly string[] ModelCandidates = new[]
        {
            "gemini-3.5-flash",
            "gemini-flash-lite-latest",
            "gemini-flash-latest"
        };

        public GeminiService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public bool IsConfigured
        {
            get
            {
                var key = _configuration["Gemini:ApiKey"];
                return !string.IsNullOrWhiteSpace(key) && !key.Equals("YOUR_GEMINI_API_KEY_HERE", StringComparison.OrdinalIgnoreCase);
            }
        }

        public async Task<string> GenerateResponseAsync(
            string systemInstruction,
            IReadOnlyList<ChatMessage> history,
            string currentPrompt,
            CancellationToken cancellationToken = default)
        {
            if (!IsConfigured)
            {
                _logger.LogInformation("Gemini API key is not configured. Falling back to internal RAG knowledge synthesizer.");
                return string.Empty;
            }

            var apiKey = _configuration["Gemini:ApiKey"]!.Trim();
            var preferredModel = _configuration["Gemini:Model"];

            var modelsToTry = new List<string>();
            if (!string.IsNullOrWhiteSpace(preferredModel))
            {
                modelsToTry.Add(preferredModel);
            }
            foreach (var m in ModelCandidates)
            {
                if (!modelsToTry.Contains(m, StringComparer.OrdinalIgnoreCase))
                {
                    modelsToTry.Add(m);
                }
            }

            // Build multi-turn contents
            var contentsList = new List<object>();
            if (history != null && history.Count > 0)
            {
                foreach (var msg in history)
                {
                    if (string.IsNullOrWhiteSpace(msg.Content)) continue;
                    contentsList.Add(new
                    {
                        role = msg.Role == "model" ? "model" : "user",
                        parts = new[]
                        {
                            new { text = msg.Content }
                        }
                    });
                }
            }

            // Append current user message
            contentsList.Add(new
            {
                role = "user",
                parts = new[]
                {
                    new { text = currentPrompt }
                }
            });

            var requestBody = new
            {
                system_instruction = new
                {
                    parts = new[]
                    {
                        new { text = systemInstruction }
                    }
                },
                contents = contentsList,
                generationConfig = new
                {
                    temperature = 0.2,
                    topP = 0.95,
                    maxOutputTokens = 2048
                }
            };

            var serialized = JsonSerializer.Serialize(requestBody);

            foreach (var model in modelsToTry)
            {
                var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                    request.Headers.Add("X-goog-api-key", apiKey);
                    request.Content = new StringContent(serialized, Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(request, cancellationToken);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorDetails = await response.Content.ReadAsStringAsync(cancellationToken);
                        _logger.LogWarning("Gemini API model {Model} returned {StatusCode}. Trying next model if available. Details: {Details}",
                            model, response.StatusCode, errorDetails);
                        continue;
                    }

                    var responseString = await response.Content.ReadAsStringAsync(cancellationToken);
                    using var doc = JsonDocument.Parse(responseString);

                    var root = doc.RootElement;
                    if (root.TryGetProperty("candidates", out var candidates) &&
                        candidates.GetArrayLength() > 0)
                    {
                        var firstCandidate = candidates[0];
                        if (firstCandidate.TryGetProperty("content", out var content) &&
                            content.TryGetProperty("parts", out var parts) &&
                            parts.GetArrayLength() > 0)
                        {
                            var text = parts[0].GetProperty("text").GetString();
                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                return text;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error calling Gemini API for model {Model}", model);
                }
            }

            return string.Empty;
        }
    }
}

