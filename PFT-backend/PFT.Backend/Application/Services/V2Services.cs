using Microsoft.EntityFrameworkCore;
using PFT.Backend.Application.DTOs.Insights;
using PFT.Backend.Application.DTOs.Rules;
using PFT.Backend.Application.DTOs.Shared;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common.Exceptions;
using PFT.Backend.Domain.Entities;
using PFT.Backend.Infrastructure.Data;

namespace PFT.Backend.Application.Services;

public sealed class InsightsService(AppDbContext db) : IInsightsService
{
    public async Task<HealthScoreDto> GetHealthScoreAsync(Guid userId, CancellationToken ct)
    {
        var from = DateTime.UtcNow.AddDays(-30);
        var income = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Income && x.TransactionDateUtc >= from).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;
        var expense = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.TransactionDateUtc >= from).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;

        var savingsRate = income == 0 ? 0 : Math.Clamp(((income - expense) / income) * 100m, 0, 100);

        var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var budgets = await db.Budgets.Where(x => x.UserId == userId && x.MonthStartUtc == currentMonth).ToListAsync(ct);
        var budgetLimit = budgets.Sum(x => x.LimitAmount);
        var budgetSpend = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.TransactionDateUtc >= currentMonth).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;
        var budgetAdherence = budgetLimit <= 0 ? 100 : Math.Clamp(100 - ((budgetSpend / budgetLimit) * 100), 0, 100);

        var accountsBalance = await db.Accounts.Where(x => x.UserId == userId && !x.IsArchived).SumAsync(x => (decimal?)x.Balance, ct) ?? 0;
        var monthlyExpense = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.TransactionDateUtc >= DateTime.UtcNow.AddDays(-30)).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;
        var cashBufferMonths = monthlyExpense <= 0 ? 3 : Math.Clamp(accountsBalance / monthlyExpense, 0, 12);

        var daily = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.TransactionDateUtc >= DateTime.UtcNow.AddDays(-60)).ToListAsync(ct);
        var grouped = daily.GroupBy(x => x.TransactionDateUtc.Date).Select(g => g.Sum(v => v.Amount)).ToList();
        var avg = grouped.Count == 0 ? 0 : grouped.Average();
        var variance = grouped.Count <= 1 ? 0 : grouped.Sum(v => (double)Math.Pow((double)(v - avg), 2)) / grouped.Count;
        var stdDev = (decimal)Math.Sqrt(variance);
        var stability = avg == 0 ? 100 : Math.Clamp(100 - (stdDev / avg) * 100, 0, 100);

        var weighted = (savingsRate * 0.35m) + (budgetAdherence * 0.25m) + (Math.Min(cashBufferMonths / 3m, 1m) * 100m * 0.25m) + (stability * 0.15m);
        var score = (int)Math.Round(Math.Clamp(weighted, 0, 100));

        return new HealthScoreDto(score, decimal.Round(savingsRate, 2), decimal.Round(budgetAdherence, 2), decimal.Round(cashBufferMonths, 2), decimal.Round(stability, 2));
    }

    public async Task<CashFlowForecastDto> GetCashFlowForecastAsync(Guid userId, int days, CancellationToken ct)
    {
        var safeDays = Math.Clamp(days, 7, 90);
        var start = DateTime.UtcNow.Date;
        var currentBalance = await db.Accounts.Where(x => x.UserId == userId && !x.IsArchived).SumAsync(x => (decimal?)x.Balance, ct) ?? 0;

        var historyFrom = DateTime.UtcNow.AddDays(-60);
        var net = await db.Transactions.Where(x => x.UserId == userId && x.TransactionDateUtc >= historyFrom)
            .Select(x => x.Type == TransactionType.Expense || x.Type == TransactionType.TransferOut ? -x.Amount : x.Amount)
            .ToListAsync(ct);
        var avgDailyNet = net.Count == 0 ? 0 : net.Sum() / 60m;

        var recurring = await db.RecurringTransactions.Where(x => x.UserId == userId && x.IsActive).ToListAsync(ct);

        var trend = new List<ForecastPointDto>(safeDays);
        var running = currentBalance;
        var hasRisk = false;
        var warnings = new List<string>();

        for (var i = 1; i <= safeDays; i++)
        {
            var day = start.AddDays(i);
            running += avgDailyNet;

            foreach (var r in recurring)
            {
                if (r.NextRunAtUtc.Date == day)
                {
                    running += r.Type == TransactionType.Expense ? -r.Amount : r.Amount;
                }
            }

            if (running < 0)
            {
                hasRisk = true;
            }

            trend.Add(new ForecastPointDto(day, decimal.Round(running, 2)));
        }

        if (hasRisk) warnings.Add("Projected balance may go negative in forecast window.");
        if (trend.LastOrDefault()?.ProjectedBalance < currentBalance * 0.5m) warnings.Add("Spending pace indicates a sharp balance drop.");

        var forecastEnd = trend.LastOrDefault()?.ProjectedBalance ?? currentBalance;
        var safeToSpend = Math.Max(0, forecastEnd - (currentBalance * 0.2m));

        return new CashFlowForecastDto(currentBalance, forecastEnd, decimal.Round(safeToSpend, 2), hasRisk, warnings, trend);
    }

    public async Task<IReadOnlyCollection<SavingsRatePointDto>> GetSavingsRateTrendAsync(Guid userId, int months, CancellationToken ct)
    {
        var safeMonths = Math.Clamp(months, 3, 24);
        var startMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(safeMonths - 1));
        var items = new List<SavingsRatePointDto>(safeMonths);

        for (var i = 0; i < safeMonths; i++)
        {
            var monthStart = startMonth.AddMonths(i);
            var monthEnd = monthStart.AddMonths(1);

            var income = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Income && x.TransactionDateUtc >= monthStart && x.TransactionDateUtc < monthEnd).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;
            var expense = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.TransactionDateUtc >= monthStart && x.TransactionDateUtc < monthEnd).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;
            var rate = income == 0 ? 0 : ((income - expense) / income) * 100m;
            items.Add(new SavingsRatePointDto(monthStart, decimal.Round(rate, 2)));
        }

        return items;
    }

    public async Task<IReadOnlyCollection<NetWorthPointDto>> GetNetWorthTrendAsync(Guid userId, int months, CancellationToken ct)
    {
        var safeMonths = Math.Clamp(months, 3, 24);
        var startMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(safeMonths - 1));
        var current = await db.Accounts.Where(x => x.UserId == userId && !x.IsArchived).SumAsync(x => (decimal?)x.Balance, ct) ?? 0;
        var monthlyNet = await GetSavingsRateTrendAsync(userId, safeMonths, ct);

        var list = new List<NetWorthPointDto>(safeMonths);
        var running = current;
        foreach (var point in monthlyNet.Reverse())
        {
            list.Add(new NetWorthPointDto(point.MonthStartUtc, decimal.Round(running, 2)));
            running -= running * (point.SavingsRatePercent / 100m) * 0.2m;
        }

        list.Reverse();
        return list;
    }
}

public sealed class RuleService(AppDbContext db) : IRuleService
{
    public async Task<IReadOnlyCollection<RuleDto>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        return await db.Rules.Where(x => x.UserId == userId).OrderBy(x => x.Priority)
            .Select(x => new RuleDto(x.Id, x.Name, x.MerchantContains, x.CategoryId, x.AddTag, x.IsActive, x.Priority)).ToListAsync(ct);
    }

    public async Task<RuleDto> CreateAsync(CreateRuleRequest request, Guid userId, CancellationToken ct)
    {
        var entity = new Rule
        {
            UserId = userId,
            Name = request.Name.Trim(),
            MerchantContains = request.MerchantContains.Trim(),
            CategoryId = request.CategoryId,
            AddTag = request.AddTag,
            IsActive = request.IsActive,
            Priority = request.Priority
        };

        db.Rules.Add(entity);
        await db.SaveChangesAsync(ct);
        return new RuleDto(entity.Id, entity.Name, entity.MerchantContains, entity.CategoryId, entity.AddTag, entity.IsActive, entity.Priority);
    }

    public async Task<RuleDto> UpdateAsync(Guid ruleId, UpdateRuleRequest request, Guid userId, CancellationToken ct)
    {
        var entity = await db.Rules.FirstOrDefaultAsync(x => x.Id == ruleId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Rule not found.", StatusCodes.Status404NotFound);

        entity.Name = request.Name.Trim();
        entity.MerchantContains = request.MerchantContains.Trim();
        entity.CategoryId = request.CategoryId;
        entity.AddTag = request.AddTag;
        entity.IsActive = request.IsActive;
        entity.Priority = request.Priority;

        await db.SaveChangesAsync(ct);
        return new RuleDto(entity.Id, entity.Name, entity.MerchantContains, entity.CategoryId, entity.AddTag, entity.IsActive, entity.Priority);
    }

    public async Task DeleteAsync(Guid ruleId, Guid userId, CancellationToken ct)
    {
        var entity = await db.Rules.FirstOrDefaultAsync(x => x.Id == ruleId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Rule not found.", StatusCodes.Status404NotFound);

        db.Rules.Remove(entity);
        await db.SaveChangesAsync(ct);
    }
}

public sealed class RuleEngineService(AppDbContext db) : IRuleEngineService
{
    public async Task ApplyRulesAsync(Guid userId, Transaction transaction, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(transaction.Merchant)) return;

        var rules = await db.Rules
            .Where(x => x.UserId == userId && x.IsActive)
            .OrderBy(x => x.Priority)
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            if (!transaction.Merchant.Contains(rule.MerchantContains, StringComparison.OrdinalIgnoreCase)) continue;

            if (rule.CategoryId.HasValue)
            {
                transaction.CategoryId = rule.CategoryId;
            }

            if (!string.IsNullOrWhiteSpace(rule.AddTag))
            {
                var existing = (transaction.TagsCsv ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
                existing.Add(rule.AddTag.Trim());
                transaction.TagsCsv = string.Join(',', existing);
            }

            break;
        }
    }
}

public sealed class SharedAccountsService(AppDbContext db) : ISharedAccountsService
{
    public async Task<IReadOnlyCollection<AccountMemberDto>> GetMembersAsync(Guid accountId, Guid userId, CancellationToken ct)
    {
        await EnsureAccountOwnerOrMember(accountId, userId, ct);

        return await db.AccountMembers.Where(x => x.AccountId == accountId)
            .OrderBy(x => x.CreatedAtUtc)
            .Select(x => new AccountMemberDto(x.Id, x.AccountId, x.MemberUserId, x.Role, x.CreatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<AccountMemberDto> AddMemberAsync(AddAccountMemberRequest request, Guid userId, CancellationToken ct)
    {
        await EnsureOwner(request.AccountId, userId, ct);
        var exists = await db.AccountMembers.AnyAsync(x => x.AccountId == request.AccountId && x.MemberUserId == request.MemberUserId, ct);
        if (exists)
        {
            throw new AppException("duplicate_member", "Member already exists for this account.");
        }

        var entity = new AccountMember
        {
            AccountId = request.AccountId,
            MemberUserId = request.MemberUserId,
            Role = request.Role
        };

        db.AccountMembers.Add(entity);
        await db.SaveChangesAsync(ct);
        return new AccountMemberDto(entity.Id, entity.AccountId, entity.MemberUserId, entity.Role, entity.CreatedAtUtc);
    }

    public async Task<AccountMemberDto> UpdateRoleAsync(Guid memberId, UpdateAccountMemberRoleRequest request, Guid userId, CancellationToken ct)
    {
        var member = await db.AccountMembers.FirstOrDefaultAsync(x => x.Id == memberId, ct)
            ?? throw new AppException("not_found", "Member record not found.", StatusCodes.Status404NotFound);

        await EnsureOwner(member.AccountId, userId, ct);
        member.Role = request.Role;
        await db.SaveChangesAsync(ct);
        return new AccountMemberDto(member.Id, member.AccountId, member.MemberUserId, member.Role, member.CreatedAtUtc);
    }

    public async Task RemoveMemberAsync(Guid memberId, Guid userId, CancellationToken ct)
    {
        var member = await db.AccountMembers.FirstOrDefaultAsync(x => x.Id == memberId, ct)
            ?? throw new AppException("not_found", "Member record not found.", StatusCodes.Status404NotFound);

        await EnsureOwner(member.AccountId, userId, ct);
        db.AccountMembers.Remove(member);
        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureOwner(Guid accountId, Guid userId, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(x => x.Id == accountId, ct)
            ?? throw new AppException("not_found", "Account not found.", StatusCodes.Status404NotFound);

        if (account.UserId == userId) return;

        var member = await db.AccountMembers.FirstOrDefaultAsync(x => x.AccountId == accountId && x.MemberUserId == userId, ct);
        if (member?.Role == "Owner") return;

        throw new AppException("forbidden", "Only account owner can perform this operation.", StatusCodes.Status403Forbidden);
    }

    private async Task EnsureAccountOwnerOrMember(Guid accountId, Guid userId, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(x => x.Id == accountId, ct)
            ?? throw new AppException("not_found", "Account not found.", StatusCodes.Status404NotFound);

        if (account.UserId == userId) return;

        var member = await db.AccountMembers.FirstOrDefaultAsync(x => x.AccountId == accountId && x.MemberUserId == userId, ct);
        if (member is null)
        {
            throw new AppException("forbidden", "You do not have access to this account.", StatusCodes.Status403Forbidden);
        }
    }
}
