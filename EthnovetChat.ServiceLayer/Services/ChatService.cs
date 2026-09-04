using System.Text;
using EthnovetChat.DataAccessLayer.Models;
using EthnovetChat.ServiceLayer.DTOs;

namespace EthnovetChat.ServiceLayer.Services
{
    public class ChatService : IChatService
    {
        private readonly IRagService _ragService;
        private readonly IGeminiService _geminiService;
        private readonly ISessionService _sessionService;
        private readonly ILogger<ChatService> _logger;

        public ChatService(
            IRagService ragService,
            IGeminiService geminiService,
            ISessionService sessionService,
            ILogger<ChatService> logger)
        {
            _ragService = ragService;
            _geminiService = geminiService;
            _sessionService = sessionService;
            _logger = logger;
        }

        public async Task<ChatResponseDto> ProcessChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default)
        {
            // 1. Get or create active session
            var session = _sessionService.GetOrCreateSession(request.SessionId);
            var history = _sessionService.GetRollingHistory(session.SessionId, maxTurns: 5);

            // 2. Detect language & animal, inheriting from ongoing session if omitted in follow-up
            var language = _ragService.DetectLanguage(request.Message, request.Language ?? session.PersistedLanguage);
            var newlyDetectedAnimal = _ragService.DetectAnimal(request.Message, request.Animal);
            var detectedAnimal = newlyDetectedAnimal ?? session.PersistedAnimal;

            // Check if conversation already has established medical context (for short follow-ups)
            bool hasPriorMedicalContext = history.Any(m => m.Role == "model" &&
                (m.Content.Contains("Ingredients") || m.Content.Contains("மூலிகைகள்") ||
                 m.Content.Contains("Dosage") || m.Content.Contains("அளவு") ||
                 m.Content.Contains("Condition Identified") || m.Content.Contains("சிகிச்சை")));

            // 3. Classify User Intent: Greeting, AnimalOnly, MedicalQuery, or GeneralInquiry
            var intent = _ragService.DetectIntent(request.Message, detectedAnimal, hasPriorMedicalContext);
            _logger.LogInformation("Processing chat for session {SessionId}. Intent: {Intent}, Animal: {Animal}, Lang: {Lang}",
                session.SessionId, intent, detectedAnimal, language);

            IReadOnlyList<EthnovetRemedy> remedies = new List<EthnovetRemedy>();
            string contextText = string.Empty;

            // 4. Clinical Triage: Only retrieve remedies if intent is an actual Medical Query
            if (intent == ChatIntent.MedicalQuery)
            {
                var searchQuery = request.Message;
                if (request.Message.Split(' ').Length < 6 && history.Count > 0)
                {
                    var lastUserTurn = history.LastOrDefault(m => m.Role == "user")?.Content;
                    if (!string.IsNullOrWhiteSpace(lastUserTurn))
                    {
                        searchQuery = $"{request.Message} {lastUserTurn}";
                    }
                }

                remedies = await _ragService.RetrieveRelevantRemediesAsync(
                    searchQuery,
                    detectedAnimal,
                    topK: 3,
                    cancellationToken);

                contextText = _ragService.FormatRagContext(remedies);
            }

            // Fast-path triage: Greetings and animal declarations do not require remote LLM latency (< 15ms response)
            if (intent == ChatIntent.Greeting || intent == ChatIntent.AnimalOnly)
            {
                var fastAnswer = GenerateFallbackResponse(intent, remedies, detectedAnimal, language);
                _sessionService.RecordTurn(session.SessionId, request.Message, fastAnswer, detectedAnimal, language);
                return new ChatResponseDto
                {
                    Answer = fastAnswer,
                    Language = language,
                    RelevantRemedies = new List<RemedyDto>(),
                    IsAiGenerated = false,
                    SessionId = session.SessionId,
                    DetectedAnimal = detectedAnimal
                };
            }

            string answer = string.Empty;
            bool isAiGenerated = false;

            // 5. Call Gemini multi-turn model with intent-tailored prompt & rolling 5-turn history
            if (_geminiService.IsConfigured)
            {
                var systemInstruction = BuildSystemInstruction(language);
                var userPrompt = BuildUserPrompt(request.Message, detectedAnimal, contextText, language, intent, remedies.Count > 0);

                answer = await _geminiService.GenerateResponseAsync(systemInstruction, history, userPrompt, cancellationToken);
                if (!string.IsNullOrWhiteSpace(answer))
                {
                    isAiGenerated = true;
                }
            }

            // 6. Fallback synthesizer if Gemini is unavailable or timed out
            if (string.IsNullOrWhiteSpace(answer))
            {
                answer = GenerateFallbackResponse(intent, remedies, detectedAnimal, language);
                isAiGenerated = false;
            }

            // 7. Record the completed turn in the rolling session history
            _sessionService.RecordTurn(session.SessionId, request.Message, answer, detectedAnimal, language);

            return new ChatResponseDto
            {
                Answer = answer,
                Language = language,
                RelevantRemedies = remedies.Select(RemedyDto.FromEntity).ToList(),
                IsAiGenerated = isAiGenerated,
                SessionId = session.SessionId,
                DetectedAnimal = detectedAnimal
            };
        }

        public async IAsyncEnumerable<ChatStreamEvent> StreamChatAsync(
            ChatRequestDto request,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            // 1. Get or create active session
            var session = _sessionService.GetOrCreateSession(request.SessionId);
            var history = _sessionService.GetRollingHistory(session.SessionId, maxTurns: 5);

            // 2. Detect language & animal, inheriting from ongoing session if omitted in follow-up
            var language = _ragService.DetectLanguage(request.Message, request.Language ?? session.PersistedLanguage);
            var newlyDetectedAnimal = _ragService.DetectAnimal(request.Message, request.Animal);
            var detectedAnimal = newlyDetectedAnimal ?? session.PersistedAnimal;

            // Check if conversation already has established medical context (for short follow-ups)
            bool hasPriorMedicalContext = history.Any(m => m.Role == "model" &&
                (m.Content.Contains("Ingredients") || m.Content.Contains("மூலிகைகள்") ||
                 m.Content.Contains("Dosage") || m.Content.Contains("அளவு") ||
                 m.Content.Contains("Condition Identified") || m.Content.Contains("சிகிச்சை")));

            // 3. Classify User Intent: Greeting, AnimalOnly, MedicalQuery, or GeneralInquiry
            var intent = _ragService.DetectIntent(request.Message, detectedAnimal, hasPriorMedicalContext);
            _logger.LogInformation("Streaming chat for session {SessionId}. Intent: {Intent}, Animal: {Animal}, Lang: {Lang}",
                session.SessionId, intent, detectedAnimal, language);

            IReadOnlyList<EthnovetRemedy> remedies = new List<EthnovetRemedy>();
            string contextText = string.Empty;

            // 4. Clinical Triage: Only retrieve remedies if intent is an actual Medical Query
            if (intent == ChatIntent.MedicalQuery)
            {
                var searchQuery = request.Message;
                if (request.Message.Split(' ').Length < 6 && history.Count > 0)
                {
                    var lastUserTurn = history.LastOrDefault(m => m.Role == "user")?.Content;
                    if (!string.IsNullOrWhiteSpace(lastUserTurn))
                    {
                        searchQuery = $"{request.Message} {lastUserTurn}";
                    }
                }

                remedies = await _ragService.RetrieveRelevantRemediesAsync(
                    searchQuery,
                    detectedAnimal,
                    topK: 3,
                    cancellationToken);

                contextText = _ragService.FormatRagContext(remedies);
            }

            // Fast-path triage: Greetings and animal declarations yield immediately (< 15ms)
            if (intent == ChatIntent.Greeting || intent == ChatIntent.AnimalOnly)
            {
                var fastAnswer = GenerateFallbackResponse(intent, remedies, detectedAnimal, language);
                _sessionService.RecordTurn(session.SessionId, request.Message, fastAnswer, detectedAnimal, language);

                yield return new ChatStreamEvent
                {
                    EventType = "meta",
                    SessionId = session.SessionId,
                    DetectedAnimal = detectedAnimal,
                    Language = language,
                    RelevantRemedies = new List<RemedyDto>(),
                    IsAiGenerated = false
                };

                yield return new ChatStreamEvent
                {
                    EventType = "token",
                    Token = fastAnswer
                };

                yield return new ChatStreamEvent
                {
                    EventType = "done"
                };

                yield break;
            }

            // 5. Emit initial metadata with matched remedies
            yield return new ChatStreamEvent
            {
                EventType = "meta",
                SessionId = session.SessionId,
                DetectedAnimal = detectedAnimal,
                Language = language,
                RelevantRemedies = remedies.Select(RemedyDto.FromEntity).ToList(),
                IsAiGenerated = _geminiService.IsConfigured
            };

            var fullAnswerBuilder = new StringBuilder();
            bool streamedAny = false;

            // 6. Stream tokens from Gemini
            if (_geminiService.IsConfigured)
            {
                var systemInstruction = BuildSystemInstruction(language);
                var userPrompt = BuildUserPrompt(request.Message, detectedAnimal, contextText, language, intent, remedies.Count > 0);

                await foreach (var token in _geminiService.StreamResponseAsync(systemInstruction, history, userPrompt, cancellationToken))
                {
                    if (!string.IsNullOrEmpty(token))
                    {
                        streamedAny = true;
                        fullAnswerBuilder.Append(token);
                        yield return new ChatStreamEvent
                        {
                            EventType = "token",
                            Token = token
                        };
                    }
                }
            }

            // 7. If model didn't stream anything (offline/timeout), provide synthesized fallback
            if (!streamedAny)
            {
                var fallbackAnswer = GenerateFallbackResponse(intent, remedies, detectedAnimal, language);
                fullAnswerBuilder.Append(fallbackAnswer);
                yield return new ChatStreamEvent
                {
                    EventType = "token",
                    Token = fallbackAnswer
                };
            }

            var finalAnswer = fullAnswerBuilder.ToString();
            _sessionService.RecordTurn(session.SessionId, request.Message, finalAnswer, detectedAnimal, language);

            yield return new ChatStreamEvent
            {
                EventType = "done"
            };
        }

        private static string BuildSystemInstruction(string language)
        {
            var isTamil = language == "ta";

            var baseInstruction =
                "You are EthnoVet Assistant, a responsible, compassionate, and highly knowledgeable ethnoveterinary AI assistant for rural farmers, livestock keepers, and veterinarians.\n" +
                "You provide verified herbal remedies and natural treatments for cattle, sheep, goats, poultry, and domestic animals based on traditional Ethnoveterinary Practices (EVP).\n" +
                "\n" +
                "CRITICAL MEDICAL & CLINICAL TRIAGE RULES (YOU MUST ALWAYS FOLLOW):\n" +
                "1. NEVER PRESCRIBE ON GREETINGS: If the user only says 'Hi', 'Hello', 'வணக்கம்' or similar greetings, warmly greet them, introduce your role as an ethnoveterinary assistant, and ask what animal and what symptoms they need help with. NEVER suggest or prescribe any remedies on a greeting.\n" +
                "2. NEVER GUESS A DISEASE WHEN ONLY AN ANIMAL IS STATED: If the user says 'I have a dog', 'i have one cow', 'மாடு இருக்கு', etc., WITHOUT stating symptoms, DO NOT guess a disease and DO NOT prescribe a remedy! Acknowledge the animal and ask triage clarifying questions (e.g. 'What symptoms or problems is your animal experiencing? Is it vomiting, having diarrhea, loss of appetite, skin problems, coughing, or wounds?').\n" +
                "3. CLINICAL TRIAGE: Only provide remedies when the user has described symptoms, an ailment, or asked for a specific treatment.\n" +
                "4. STRICT KNOWLEDGE BASE GROUNDING: Use the provided verified remedies knowledge base. If a condition is not in the knowledge base, state clearly that this specific condition is not covered in the verified traditional EVP dataset, provide safe supportive care, and advise immediate veterinary consultation.\n" +
                "5. STRUCTURED TREATMENT FORMAT: When giving remedy advice, format clearly:\n" +
                "   - **Condition Identified**\n" +
                "   - **Recommended Herbal Ingredients**\n" +
                "   - **Step-by-Step Preparation**\n" +
                "   - **Dosage & Administration** (clearly specify differences for adult vs young animals)\n" +
                "   - ⚠️ **Important Safety Advice** (when to consult a local veterinarian)\n" +
                "6. SPECIES SAFETY: Exercise special caution with dogs. Never prescribe remedies meant exclusively for ruminants (cattle/buffalo) that contain substances harmful or toxic to dogs (e.g. excessive castor oil or high doses of garlic).\n";

            if (isTamil)
            {
                baseInstruction +=
                    "\nIMPORTANT LANGUAGE REQUIREMENT:\n" +
                    "The user requested or queried in Tamil (தமிழ்).\n" +
                    "Respond entirely in natural, fluent, easily understandable Tamil language (தமிழ்).\n" +
                    "Use common Tamil names for plants and herbs (e.g. வேப்பிலை, சோற்றுக்கற்றாழை, மஞ்சள், மிளகு, சீரகம், துளசி, இஞ்சி, சுக்கு, கொய்யா இலை) along with preparation instructions.\n";
            }
            else
            {
                baseInstruction +=
                    "\nRespond in clear, accessible English. Include local/vernacular names of plants alongside botanical or common English names if available.\n";
            }

            return baseInstruction;
        }

        private static string BuildUserPrompt(
            string userQuery,
            string? detectedAnimal,
            string context,
            string language,
            ChatIntent intent,
            bool hasMatchingRemedies)
        {
            var sb = new StringBuilder();

            if (intent == ChatIntent.Greeting)
            {
                sb.AppendLine($"User Query: {userQuery}");
                sb.AppendLine($"Target Language: {(language == "ta" ? "Tamil (தமிழ்)" : "English")}");
                sb.AppendLine();
                sb.AppendLine("INSTRUCTION: The user is greeting you. Respond with a warm, welcoming greeting. Introduce yourself as EthnoVet Assistant, explain that you support cattle, sheep, goats, poultry, and domestic animals with traditional herbal remedies, and politely ask which animal and what symptoms they need help with. DO NOT suggest or prescribe any remedies.");
                return sb.ToString();
            }

            if (intent == ChatIntent.AnimalOnly)
            {
                sb.AppendLine($"User Query: {userQuery}");
                if (!string.IsNullOrWhiteSpace(detectedAnimal))
                {
                    sb.AppendLine($"Target Animal: {detectedAnimal}");
                }
                sb.AppendLine($"Target Language: {(language == "ta" ? "Tamil (தமிழ்)" : "English")}");
                sb.AppendLine();
                sb.AppendLine($"INSTRUCTION: The user has ONLY informed you that they have a {detectedAnimal ?? "pet/livestock"}, but has NOT described any symptoms, illness, or medical query. Acknowledge the {detectedAnimal ?? "animal"} warmly, and ask clarifying triage questions: What specific symptoms, unusual behaviors, or problems is the {detectedAnimal ?? "animal"} showing (e.g. vomiting, diarrhea, loss of appetite, fever, skin rash/itching, wounds, coughing)? DO NOT guess a disease or prescribe any remedy yet.");
                return sb.ToString();
            }

            if (intent == ChatIntent.GeneralInquiry)
            {
                sb.AppendLine($"User Query: {userQuery}");
                sb.AppendLine($"Target Language: {(language == "ta" ? "Tamil (தமிழ்)" : "English")}");
                sb.AppendLine();
                sb.AppendLine("INSTRUCTION: The user has asked a general question about ethnoveterinary care or animal health. Answer clearly and informatively. Ask if they have a specific animal ailment they would like help with.");
                return sb.ToString();
            }

            // Medical Query
            sb.AppendLine("Retrieved Verified Ethnoveterinary Remedies:");
            sb.AppendLine(context);
            sb.AppendLine();
            sb.AppendLine($"User Query: {userQuery}");
            if (!string.IsNullOrWhiteSpace(detectedAnimal))
            {
                sb.AppendLine($"Target Animal: {detectedAnimal}");
            }
            sb.AppendLine($"Target Language: {(language == "ta" ? "Tamil (தமிழ்)" : "English")}");
            sb.AppendLine();

            if (hasMatchingRemedies)
            {
                sb.AppendLine("INSTRUCTION: The user is reporting symptoms or asking about a medical condition. Review the verified remedies above and provide structured ethnoveterinary advice: Condition Identified, Recommended Herbal Ingredients, Step-by-Step Preparation, Dosage & Administration (clarifying adult vs young animal doses), and Veterinary Emergency Warnings.");
            }
            else
            {
                sb.AppendLine("INSTRUCTION: No exact matching remedy was found in the verified EVP dataset for this specific query. Inform the user clearly that this specific condition is not in the traditional database, provide general supportive care advice if safe, and strongly recommend consulting a licensed veterinarian.");
            }

            return sb.ToString();
        }

        private static string GenerateFallbackResponse(ChatIntent intent, IReadOnlyList<EthnovetRemedy> remedies, string? detectedAnimal, string language)
        {
            var sb = new StringBuilder();
            var isTamil = language == "ta";

            if (intent == ChatIntent.Greeting)
            {
                if (isTamil)
                {
                    return "👋 **வணக்கம்! நான் எத்னோவெட் (EthnoVet) மூலிகை மருத்துவ உதவியாளர்.**\n\nபசு, எருமை, ஆடு, கோழி, நாய் போன்ற கால்நடைகளுக்கான பாரம்பரிய மூலிகை சிகிச்சைகளை நான் வழிகாட்டுகிறேன்.\n\nஇன்று உங்கள் கால்நடைக்கு என்ன உதவி வேண்டும்? என்ன விலங்கு மற்றும் என்ன அறிகுறிகள் உள்ளன என்பதைத் தெரிவியுங்கள்.";
                }
                return "👋 **Hello! I am your EthnoVet Assistant.**\n\nI am here to help you care for cattle, sheep, goats, poultry, and domestic animals using verified traditional herbal remedies.\n\nHow can I help you today? Please tell me which animal you have and what symptoms you are observing.";
            }

            if (intent == ChatIntent.AnimalOnly)
            {
                if (isTamil)
                {
                    return $"சரி, உங்கள் **{detectedAnimal ?? "கால்நடை"}**க்கு என்ன பிரச்சனை அல்லது அறிகுறிகள் தென்படுகின்றன?\n\nஎடுத்துக்காட்டாக: வாந்தி, தீவனம் சாப்பிடாமல் இருப்பது, கழிச்சல், தோல் அரிப்பு/புண், காயம், சளி அல்லது மூச்சுத்திணறல் உள்ளதா? விவரங்களைத் தெரிவியுங்கள்.";
                }
                return $"I understand you have a **{detectedAnimal ?? "pet/animal"}**.\n\nWhat symptoms or health concerns is it experiencing? For example: vomiting, loss of appetite, diarrhea, skin itching/rash, wounds, or breathing difficulty? Please share more details so I can recommend the right safe traditional remedy.";
            }

            // Fallback for medical query
            if (isTamil)
            {
                sb.AppendLine("🌿 **நாட்டு மருத்துவ ஆலோசனை (Ethnoveterinary Advice)**\n");

                if (remedies.Count == 0)
                {
                    sb.AppendLine("மன்னிக்கவும், உங்கள் கேள்விக்குரிய மூலிகை சிகிச்சை தகவல் பாரம்பரிய தரவுத்தளத்தில் நேரடியாக கிடைக்கவில்லை. நிலைமை மோசமடையாமல் இருக்க அருகிலுள்ள கால்நடை மருத்துவரை அணுகவும்.");
                    return sb.ToString();
                }

                var primary = remedies[0];
                sb.AppendLine($"**நோய் / பிரச்சனை**: {primary.Disease}");
                if (!string.IsNullOrWhiteSpace(primary.Animal))
                {
                    sb.AppendLine($"**விலங்கு**: {primary.Animal}");
                }
                if (!string.IsNullOrWhiteSpace(primary.Symptoms))
                {
                    sb.AppendLine($"**அறிகுறிகள்**: {primary.Symptoms}");
                }

                sb.AppendLine();
                sb.AppendLine($"**தேவையான மூலிகைகள் / பொருட்கள்**:");
                sb.AppendLine(primary.Ingredients);

                sb.AppendLine();
                sb.AppendLine($"**செய்முறை மற்றும் கொடுக்கும் அளவு (Treatment)**:");
                sb.AppendLine(primary.Treatment);

                sb.AppendLine();
                sb.AppendLine("⚠️ *குறிப்பு: 2-3 நாட்களுக்குள் முன்னேற்றம் தெரியாவிட்டால் அல்லது நிலைமை மோசமடைந்தால் உடனடியாக கால்நடை மருத்துவரை அணுகவும்.*");
            }
            else
            {
                sb.AppendLine("🌿 **Ethnoveterinary Care Recommendation**\n");

                if (remedies.Count == 0)
                {
                    sb.AppendLine("This specific condition is not covered in our verified traditional ethnoveterinary dataset. Please consult a qualified veterinarian promptly for proper medical diagnosis.");
                    return sb.ToString();
                }

                var primary = remedies[0];
                sb.AppendLine($"**Condition / Disease**: {primary.Disease}");
                if (!string.IsNullOrWhiteSpace(primary.Animal))
                {
                    sb.AppendLine($"**Applicable Animal(s)**: {primary.Animal}");
                }
                if (!string.IsNullOrWhiteSpace(primary.Symptoms))
                {
                    sb.AppendLine($"**Symptoms**: {primary.Symptoms}");
                }

                sb.AppendLine();
                sb.AppendLine("**Required Herbal Ingredients**:");
                sb.AppendLine(primary.Ingredients);

                sb.AppendLine();
                sb.AppendLine("**Preparation & Administration Method**:");
                sb.AppendLine(primary.Treatment);

                if (remedies.Count > 1)
                {
                    sb.AppendLine();
                    sb.AppendLine("**Alternative / Related Remedies**:");
                    for (int i = 1; i < remedies.Count; i++)
                    {
                        var alt = remedies[i];
                        sb.AppendLine($"- *{alt.Disease}* ({alt.Animal}): {alt.Treatment.Split('.').FirstOrDefault()}...");
                    }
                }

                sb.AppendLine();
                sb.AppendLine("⚠️ *Note: If condition is acute or symptoms persist beyond 2-3 days, consult a qualified veterinarian promptly.*");
            }

            return sb.ToString();
        }
    }
}

