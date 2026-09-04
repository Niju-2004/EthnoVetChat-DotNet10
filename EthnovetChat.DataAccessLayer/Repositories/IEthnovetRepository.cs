using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.DataAccessLayer.Repositories
{
    public interface IEthnovetRepository
    {
        Task<IReadOnlyList<EthnovetRemedy>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<EthnovetRemedy?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<EthnovetRemedy>> SearchAsync(SearchFilter filter, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<string>> GetDistinctDiseasesAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<string>> GetDistinctAnimalsAsync(CancellationToken cancellationToken = default);
    }
}

