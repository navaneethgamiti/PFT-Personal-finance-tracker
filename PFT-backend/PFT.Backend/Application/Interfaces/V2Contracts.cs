using PFT.Backend.Application.DTOs.Insights;
using PFT.Backend.Application.DTOs.Rules;
using PFT.Backend.Application.DTOs.Shared;
using PFT.Backend.Domain.Entities;

namespace PFT.Backend.Application.Interfaces;

public interface IInsightsService
{
    Task<HealthScoreDto> GetHealthScoreAsync(Guid userId, CancellationToken ct);
    Task<CashFlowForecastDto> GetCashFlowForecastAsync(Guid userId, int days, CancellationToken ct);
    Task<IReadOnlyCollection<SavingsRatePointDto>> GetSavingsRateTrendAsync(Guid userId, int months, CancellationToken ct);
    Task<IReadOnlyCollection<NetWorthPointDto>> GetNetWorthTrendAsync(Guid userId, int months, CancellationToken ct);
}

public interface IRuleService
{
    Task<IReadOnlyCollection<RuleDto>> GetAllAsync(Guid userId, CancellationToken ct);
    Task<RuleDto> CreateAsync(CreateRuleRequest request, Guid userId, CancellationToken ct);
    Task<RuleDto> UpdateAsync(Guid ruleId, UpdateRuleRequest request, Guid userId, CancellationToken ct);
    Task DeleteAsync(Guid ruleId, Guid userId, CancellationToken ct);
}

public interface IRuleEngineService
{
    Task ApplyRulesAsync(Guid userId, Transaction transaction, CancellationToken ct);
}

public interface ISharedAccountsService
{
    Task<IReadOnlyCollection<AccountMemberDto>> GetMembersAsync(Guid accountId, Guid userId, CancellationToken ct);
    Task<AccountMemberDto> AddMemberAsync(AddAccountMemberRequest request, Guid userId, CancellationToken ct);
    Task<AccountMemberDto> UpdateRoleAsync(Guid memberId, UpdateAccountMemberRoleRequest request, Guid userId, CancellationToken ct);
    Task RemoveMemberAsync(Guid memberId, Guid userId, CancellationToken ct);
}
