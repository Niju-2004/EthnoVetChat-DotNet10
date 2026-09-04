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
            "gemini-3.1-flash-lite",
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
            var modelsToTry = GetModelsToTry(preferredModel);
            var serialized = BuildRequestBody(systemInstruction, history, currentPrompt);

            foreach (var model in modelsToTry)
            {
                var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

                try
                {
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    cts.CancelAfter(TimeSpan.FromSeconds(5));

                    using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                    request.Headers.Add("X-goog-api-key", apiKey);
                    request.Content = new StringContent(serialized, Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(request, cts.Token);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorDetails = await response.Content.ReadAsStringAsync(cts.Token);
                        _logger.LogWarning("Gemini API model {Model} returned {StatusCode}. Trying next model. Details: {Details}",
                            model, response.StatusCode, errorDetails);
                        continue;
                    }

                    var responseString = await response.Content.ReadAsStringAsync(cts.Token);
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
                    _logger.LogWarning(ex, "Error or timeout calling Gemini API for model {Model}", model);
                }
            }

            return string.Empty;
        }

        public async IAsyncEnumerable<string> StreamResponseAsync(
            string systemInstruction,
            IReadOnlyList<ChatMessage> history,
            string currentPrompt,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            if (!IsConfigured)
            {
                yield break;
            }

            var apiKey = _configuration["Gemini:ApiKey"]!.Trim();
            var preferredModel = _configuration["Gemini:Model"];
            var modelsToTry = GetModelsToTry(preferredModel);
            var serialized = BuildRequestBody(systemInstruction, history, currentPrompt);

            foreach (var model in modelsToTry)
            {
                var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse";
                bool streamedAny = false;

                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(7));

                HttpResponseMessage? response = null;
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                    request.Headers.Add("X-goog-api-key", apiKey);
                    request.Content = new StringContent(serialized, Encoding.UTF8, "application/json");

                    response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cts.Token);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Streaming connection failed for model {Model}: {Message}", model, ex.Message);
                    continue;
                }

                if (!response.IsSuccessStatusCode)
                {
                    response.Dispose();
                    continue;
                }

                using (response)
                {
                    using var stream = await response.Content.ReadAsStreamAsync(cts.Token);
                    using var reader = new StreamReader(stream);

                    while (!cts.Token.IsCancellationRequested)
                    {
                        string? line;
                        try
                        {
                            line = await reader.ReadLineAsync(cts.Token);
                        }
                        catch
                        {
                            break;
                        }

                        if (line == null) break;
                        if (string.IsNullOrWhiteSpace(line)) continue;

                        if (line.StartsWith("data: "))
                        {
                            var json = line.Substring(6).Trim();
                            if (json == "[DONE]") break;

                            string? text = null;
                            try
                            {
                                using var doc = JsonDocument.Parse(json);
                                if (doc.RootElement.TryGetProperty("candidates", out var candidates) &&
                                    candidates.GetArrayLength() > 0)
                                {
                                    var candidate = candidates[0];
                                    if (candidate.TryGetProperty("content", out var content) &&
                                        content.TryGetProperty("parts", out var parts) &&
                                        parts.GetArrayLength() > 0)
                                    {
                                        text = parts[0].GetProperty("text").GetString();
                                    }
                                }
                            }
                            catch
                            {
                                // Ignore json parsing errors on partial chunk
                            }

                            if (!string.IsNullOrEmpty(text))
                            {
                                streamedAny = true;
                                yield return text;
                            }
                        }
                    }
                }

                if (streamedAny)
                {
                    yield break;
                }
            }
        }

        private List<string> GetModelsToTry(string? preferredModel)
        {
            var list = new List<string>();
            if (!string.IsNullOrWhiteSpace(preferredModel))
            {
                list.Add(preferredModel);
            }
            foreach (var m in ModelCandidates)
            {
                if (!list.Contains(m, StringComparer.OrdinalIgnoreCase))
                {
                    list.Add(m);
                }
            }
            return list;
        }

        private string BuildRequestBody(string systemInstruction, IReadOnlyList<ChatMessage> history, string currentPrompt)
        {
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
                    maxOutputTokens = 800
                }
            };

            return JsonSerializer.Serialize(requestBody);
        }
    }
}

