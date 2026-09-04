using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.ServiceLayer.Services
{
    public enum ChatIntent
    {
        Greeting,
        AnimalOnly,
        MedicalQuery,
        GeneralInquiry
    }

    public interface IRagService
    {
        Task<IReadOnlyList<EthnovetRemedy>> RetrieveRelevantRemediesAsync(string query, string? animal = null, int topK = 3, CancellationToken cancellationToken = default);
        string FormatRagContext(IReadOnlyList<EthnovetRemedy> remedies);
        string? DetectAnimal(string query, string? preferredAnimal = null);
        string DetectLanguage(string text, string? requestedLanguage = null);
        ChatIntent DetectIntent(string query, string? detectedAnimal, bool hasPriorMedicalContext = false);
    }
}

