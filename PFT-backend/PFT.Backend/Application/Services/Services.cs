using Microsoft.EntityFrameworkCore;
using PFT.Backend.Application.DTOs.Accounts;
using PFT.Backend.Application.DTOs.Auth;
using PFT.Backend.Application.DTOs.Budgets;
using PFT.Backend.Application.DTOs.Categories;
using PFT.Backend.Application.DTOs.Goals;
using PFT.Backend.Application.DTOs.Recurring;
using PFT.Backend.Application.DTOs.Reports;
using PFT.Backend.Application.DTOs.Transactions;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Application.Validators;
using PFT.Backend.Common;
using PFT.Backend.Common.Exceptions;
using PFT.Backend.Domain.Entities;
using PFT.Backend.Infrastructure.Data;

namespace PFT.Backend.Application.Services;

public sealed class AuthService(AppDbContext db, IPasswordHashService hashService, ITokenService tokenService) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(x => x.Email == email, ct))
        {
            throw new AppException("email_in_use", "Email is already registered.");
        }

        var (hash, salt) = hashService.HashPassword(request.Password);
        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            PasswordHash = hash,
            PasswordSalt = salt
        };

        db.Users.Add(user);
        db.Accounts.AddRange(DefaultAccounts(user.Id));
        db.Categories.AddRange(DefaultCategories(user.Id));
        await db.SaveChangesAsync(ct);

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email == request.Email.Trim().ToLowerInvariant(), ct)
            ?? throw new AppException("invalid_credentials", "Invalid email or password.", StatusCodes.Status401Unauthorized);

        if (!hashService.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
        {
            throw new AppException("invalid_credentials", "Invalid email or password.", StatusCodes.Status401Unauthorized);
        }

        await EnsureSetupEssentialsAsync(user.Id, ct);
        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken ct)
    {
        var hash = tokenService.HashToken(request.RefreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAtUtc == null, ct)
            ?? throw new AppException("invalid_refresh_token", "Refresh token is invalid.", StatusCodes.Status401Unauthorized);

        if (stored.ExpiresAtUtc <= DateTime.UtcNow)
        {
            throw new AppException("invalid_refresh_token", "Refresh token has expired.", StatusCodes.Status401Unauthorized);
        }

        var user = await db.Users.FirstAsync(x => x.Id == stored.UserId, ct);
        stored.RevokedAtUtc = DateTime.UtcNow;
        return await IssueTokensAsync(user, ct);
    }

    public async Task<string> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email == request.Email.Trim().ToLowerInvariant(), ct);
        if (user is null)
        {
            return "If this email exists, a reset link has been generated.";
        }

        var raw = tokenService.CreateSecureToken();
        var token = $"{user.Id:N}.{raw}";
        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenService.HashToken(raw),
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1)
        });
        await db.SaveChangesAsync(ct);

        // In production this should be emailed. Returning token is dev-friendly bootstrap behavior.
        return token;
    }

    public async Task ResetPasswordAsync(Guid userId, ResetPasswordRequest request, CancellationToken ct)
    {
        var parts = request.Token.Split('.', 2);
        if (parts.Length != 2 || !Guid.TryParse(parts[0], out var tokenUserId) || tokenUserId != userId)
        {
            throw new AppException("invalid_token", "Reset token is invalid.");
        }

        var hashed = tokenService.HashToken(parts[1]);
        var stored = await db.PasswordResetTokens.FirstOrDefaultAsync(
            x => x.UserId == tokenUserId && x.TokenHash == hashed && x.UsedAtUtc == null,
            ct) ?? throw new AppException("invalid_token", "Reset token is invalid.");

        if (stored.ExpiresAtUtc <= DateTime.UtcNow)
        {
            throw new AppException("expired_token", "Reset token has expired.");
        }

        var user = await db.Users.FirstAsync(x => x.Id == tokenUserId, ct);
        var (hash, salt) = hashService.HashPassword(request.NewPassword);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;
        stored.UsedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var access = tokenService.CreateAccessToken(user);
        var refresh = tokenService.CreateSecureToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = tokenService.HashToken(refresh),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(14)
        });
        await db.SaveChangesAsync(ct);

        return new AuthResponse(access, refresh, DateTime.UtcNow.AddMinutes(30));
    }

    private static IEnumerable<Category> DefaultCategories(Guid userId)
    {
        var defaults = new[] { "Groceries", "Rent", "Transport", "Salary", "Freelance" };
        return defaults.Select(name => new Category
        {
            UserId = userId,
            Name = name,
            Type = name is "Salary" or "Freelance" ? "Income" : "Expense",
            IsDefault = true
        });
    }

    private static IEnumerable<Account> DefaultAccounts(Guid userId) =>
    [
        new Account
        {
            UserId = userId,
            Name = "Primary Bank",
            Type = "Bank",
            Currency = "USD",
            Balance = 0
        }
    ];

    private async Task EnsureSetupEssentialsAsync(Guid userId, CancellationToken ct)
    {
        var hasAnyAccount = await db.Accounts.AnyAsync(x => x.UserId == userId, ct);
        if (!hasAnyAccount)
        {
            db.Accounts.AddRange(DefaultAccounts(userId));
        }

        var hasAnyCategory = await db.Categories.AnyAsync(x => x.UserId == userId, ct);
        if (!hasAnyCategory)
        {
            db.Categories.AddRange(DefaultCategories(userId));
        }

        if (!hasAnyAccount || !hasAnyCategory)
        {
            await db.SaveChangesAsync(ct);
        }
    }
}

public sealed class AccountService(AppDbContext db) : IAccountService
{
    public async Task<AccountBalanceDto> CreateAsync(CreateAccountRequest request, Guid userId, CancellationToken ct)
    {
        var entity = new Account
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Type = request.Type.Trim(),
            Currency = request.Currency.Trim().ToUpperInvariant(),
            Balance = request.InitialBalance
        };

        db.Accounts.Add(entity);
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<IReadOnlyCollection<AccountBalanceDto>> GetBalancesAsync(Guid userId, CancellationToken ct)
    {
        var accounts = await db.Accounts
            .Where(x => x.UserId == userId && !x.IsArchived)
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        return accounts.Select(ToDto).ToList();
    }

    public async Task TransferAsync(TransferFundsRequest request, Guid userId, CancellationToken ct)
    {
        if (request.FromAccountId == request.ToAccountId)
        {
            throw new AppException("invalid_transfer", "From and to accounts cannot be same.");
        }

        var from = await db.Accounts.FirstOrDefaultAsync(x => x.Id == request.FromAccountId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Source account not found.", StatusCodes.Status404NotFound);
        var to = await db.Accounts.FirstOrDefaultAsync(x => x.Id == request.ToAccountId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Destination account not found.", StatusCodes.Status404NotFound);

        if (from.Balance < request.Amount)
        {
            throw new AppException("insufficient_funds", "Insufficient balance.");
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        from.Balance -= request.Amount;
        to.Balance += request.Amount;
        var relationId = Guid.NewGuid();

        db.Transactions.AddRange(
            new Transaction
            {
                UserId = userId,
                AccountId = from.Id,
                Amount = request.Amount,
                Type = TransactionType.TransferOut,
                RelatedTransferId = relationId,
                Note = request.Note,
                TransactionDateUtc = DateTime.UtcNow
            },
            new Transaction
            {
                UserId = userId,
                AccountId = to.Id,
                Amount = request.Amount,
                Type = TransactionType.TransferIn,
                RelatedTransferId = relationId,
                Note = request.Note,
                TransactionDateUtc = DateTime.UtcNow
            });

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    private static AccountBalanceDto ToDto(Account x) => new(x.Id, x.Name, x.Currency, x.Balance, x.Type);
}

public sealed class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<IReadOnlyCollection<CategoryDto>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        return await db.Categories
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.Type)
            .ThenBy(x => x.Name)
            .Select(x => new CategoryDto(x.Id, x.Name, x.Type, x.IsDefault, x.IsArchived))
            .ToListAsync(ct);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, Guid userId, CancellationToken ct)
    {
        var entity = new Category
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Type = request.Type,
            IsDefault = false
        };
        db.Categories.Add(entity);
        await db.SaveChangesAsync(ct);
        return new CategoryDto(entity.Id, entity.Name, entity.Type, entity.IsDefault, entity.IsArchived);
    }

    public async Task<CategoryDto> UpdateAsync(Guid categoryId, UpdateCategoryRequest request, Guid userId, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(x => x.Id == categoryId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Category not found.", StatusCodes.Status404NotFound);

        category.Name = request.Name.Trim();
        category.IsArchived = request.IsArchived;
        await db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Name, category.Type, category.IsDefault, category.IsArchived);
    }
}

public sealed class TransactionService(AppDbContext db, IRuleEngineService ruleEngineService) : ITransactionService
{
    public async Task<TransactionDto> CreateAsync(CreateTransactionRequest request, Guid userId, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(x => x.Id == request.AccountId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Account not found.", StatusCodes.Status404NotFound);

        var tx = new Transaction
        {
            UserId = userId,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Type = request.Type,
            Merchant = request.Merchant,
            Note = request.Note,
            TagsCsv = request.TagsCsv,
            TransactionDateUtc = request.TransactionDateUtc
        };

        await ruleEngineService.ApplyRulesAsync(userId, tx, ct);

        account.Balance += BalanceImpact(tx.Type, tx.Amount);
        db.Transactions.Add(tx);
        await db.SaveChangesAsync(ct);

        return ToDto(tx);
    }

    public async Task<TransactionDto> UpdateAsync(Guid id, UpdateTransactionRequest request, Guid userId, CancellationToken ct)
    {
        var entity = await db.Transactions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Transaction not found.", StatusCodes.Status404NotFound);

        if (entity.Type is TransactionType.TransferIn or TransactionType.TransferOut)
        {
            throw new AppException("invalid_operation", "Transfer transactions cannot be edited.");
        }

        var account = await db.Accounts.FirstAsync(x => x.Id == entity.AccountId && x.UserId == userId, ct);
        account.Balance -= BalanceImpact(entity.Type, entity.Amount);

        entity.Amount = request.Amount;
        entity.Merchant = request.Merchant;
        entity.Note = request.Note;
        entity.TagsCsv = request.TagsCsv;
        entity.CategoryId = request.CategoryId;
        entity.TransactionDateUtc = request.TransactionDateUtc;

        account.Balance += BalanceImpact(entity.Type, entity.Amount);
        await db.SaveChangesAsync(ct);

        return ToDto(entity);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var entity = await db.Transactions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Transaction not found.", StatusCodes.Status404NotFound);

        if (entity.Type is TransactionType.TransferIn or TransactionType.TransferOut)
        {
            throw new AppException("invalid_operation", "Transfer transactions cannot be deleted individually.");
        }

        var account = await db.Accounts.FirstAsync(x => x.Id == entity.AccountId && x.UserId == userId, ct);
        account.Balance -= BalanceImpact(entity.Type, entity.Amount);

        db.Transactions.Remove(entity);
        await db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<TransactionDto>> GetPagedAsync(TransactionListQuery query, Guid userId, CancellationToken ct)
    {
        var (page, pageSize) = QueryValidator.NormalizePaging(query.Page, query.PageSize);
        var tx = db.Transactions.AsQueryable().Where(x => x.UserId == userId);

        if (query.AccountId.HasValue) tx = tx.Where(x => x.AccountId == query.AccountId);
        if (query.CategoryId.HasValue) tx = tx.Where(x => x.CategoryId == query.CategoryId);
        if (query.Type.HasValue) tx = tx.Where(x => x.Type == query.Type);
        if (query.StartDateUtc.HasValue) tx = tx.Where(x => x.TransactionDateUtc >= query.StartDateUtc.Value);
        if (query.EndDateUtc.HasValue) tx = tx.Where(x => x.TransactionDateUtc <= query.EndDateUtc.Value);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            tx = tx.Where(x =>
                (x.Note != null && x.Note.Contains(query.Search)) ||
                (x.Merchant != null && x.Merchant.Contains(query.Search)) ||
                (x.TagsCsv != null && x.TagsCsv.Contains(query.Search)));
        }

        var total = await tx.CountAsync(ct);
        var items = await tx.OrderByDescending(x => x.TransactionDateUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new TransactionDto(x.Id, x.AccountId, x.CategoryId, x.Type, x.Amount, x.Merchant, x.Note, x.TagsCsv, x.TransactionDateUtc))
            .ToListAsync(ct);

        return new PagedResult<TransactionDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    private static decimal BalanceImpact(TransactionType type, decimal amount) => type switch
    {
        TransactionType.Income => amount,
        TransactionType.Expense => -amount,
        TransactionType.TransferIn => amount,
        TransactionType.TransferOut => -amount,
        _ => 0
    };

    private static TransactionDto ToDto(Transaction x) => new(x.Id, x.AccountId, x.CategoryId, x.Type, x.Amount, x.Merchant, x.Note, x.TagsCsv, x.TransactionDateUtc);
}

public sealed class BudgetService(AppDbContext db) : IBudgetService
{
    public async Task<BudgetDto> UpsertAsync(UpsertBudgetRequest request, Guid userId, CancellationToken ct)
    {
        var monthStart = ServiceHelpers.EnsureMonthStart(request.MonthStartUtc);
        var existing = await db.Budgets.FirstOrDefaultAsync(
            x => x.UserId == userId && x.CategoryId == request.CategoryId && x.MonthStartUtc == monthStart,
            ct);

        if (existing is null)
        {
            existing = new Budget
            {
                UserId = userId,
                CategoryId = request.CategoryId,
                MonthStartUtc = monthStart,
                LimitAmount = request.LimitAmount,
                AlertThresholdPercent = request.AlertThresholdPercent
            };
            db.Budgets.Add(existing);
        }
        else
        {
            existing.LimitAmount = request.LimitAmount;
            existing.AlertThresholdPercent = request.AlertThresholdPercent;
        }

        await db.SaveChangesAsync(ct);
        return await BuildBudgetDto(existing, ct);
    }

    public async Task<IReadOnlyCollection<BudgetDto>> GetMonthlyAsync(DateTime monthStartUtc, Guid userId, CancellationToken ct)
    {
        var month = ServiceHelpers.EnsureMonthStart(monthStartUtc);
        var budgets = await db.Budgets.Where(x => x.UserId == userId && x.MonthStartUtc == month).ToListAsync(ct);

        var result = new List<BudgetDto>(budgets.Count);
        foreach (var budget in budgets)
        {
            result.Add(await BuildBudgetDto(budget, ct));
        }

        return result;
    }

    public async Task<IReadOnlyCollection<BudgetDto>> DuplicatePreviousMonthAsync(DateTime monthStartUtc, Guid userId, CancellationToken ct)
    {
        var month = ServiceHelpers.EnsureMonthStart(monthStartUtc);
        var prev = month.AddMonths(-1);
        var prevBudgets = await db.Budgets.Where(x => x.UserId == userId && x.MonthStartUtc == prev).ToListAsync(ct);

        foreach (var old in prevBudgets)
        {
            var exists = await db.Budgets.AnyAsync(x => x.UserId == userId && x.MonthStartUtc == month && x.CategoryId == old.CategoryId, ct);
            if (!exists)
            {
                db.Budgets.Add(new Budget
                {
                    UserId = userId,
                    CategoryId = old.CategoryId,
                    MonthStartUtc = month,
                    LimitAmount = old.LimitAmount,
                    AlertThresholdPercent = old.AlertThresholdPercent
                });
            }
        }

        await db.SaveChangesAsync(ct);
        return await GetMonthlyAsync(month, userId, ct);
    }

    private async Task<BudgetDto> BuildBudgetDto(Budget budget, CancellationToken ct)
    {
        var monthEnd = budget.MonthStartUtc.AddMonths(1);
        var spend = await db.Transactions
            .Where(x => x.UserId == budget.UserId && x.CategoryId == budget.CategoryId && x.Type == TransactionType.Expense && x.TransactionDateUtc >= budget.MonthStartUtc && x.TransactionDateUtc < monthEnd)
            .SumAsync(x => (decimal?)x.Amount, ct) ?? 0;

        var thresholdAmount = budget.LimitAmount * (budget.AlertThresholdPercent / 100m);
        var crossed = spend >= thresholdAmount;

        if (crossed)
        {
            db.Notifications.Add(new Notification
            {
                UserId = budget.UserId,
                Type = "budget_threshold",
                Message = $"Budget threshold crossed for category {budget.CategoryId}."
            });
            await db.SaveChangesAsync(ct);
        }

        return new BudgetDto(budget.Id, budget.CategoryId, budget.MonthStartUtc, budget.LimitAmount, budget.AlertThresholdPercent, spend, crossed);
    }
}

public sealed class GoalService(AppDbContext db) : IGoalService
{
    public async Task<GoalDto> CreateAsync(CreateGoalRequest request, Guid userId, CancellationToken ct)
    {
        var goal = new Goal
        {
            UserId = userId,
            Name = request.Name.Trim(),
            TargetAmount = request.TargetAmount,
            TargetDateUtc = request.TargetDateUtc
        };
        db.Goals.Add(goal);
        await db.SaveChangesAsync(ct);
        return ToDto(goal);
    }

    public async Task<GoalDto> UpdateAsync(Guid goalId, UpdateGoalRequest request, Guid userId, CancellationToken ct)
    {
        var goal = await db.Goals.FirstOrDefaultAsync(x => x.Id == goalId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Goal not found.", StatusCodes.Status404NotFound);

        goal.Name = request.Name.Trim();
        goal.TargetAmount = request.TargetAmount;
        goal.TargetDateUtc = request.TargetDateUtc;
        await db.SaveChangesAsync(ct);
        return ToDto(goal);
    }

    public async Task<GoalDto> ContributeAsync(Guid goalId, GoalContributionRequest request, Guid userId, CancellationToken ct)
    {
        var goal = await db.Goals.FirstOrDefaultAsync(x => x.Id == goalId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Goal not found.", StatusCodes.Status404NotFound);

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        goal.CurrentAmount += request.Amount;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return ToDto(goal);
    }

    public async Task<GoalDto> WithdrawAsync(Guid goalId, GoalContributionRequest request, Guid userId, CancellationToken ct)
    {
        var goal = await db.Goals.FirstOrDefaultAsync(x => x.Id == goalId && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Goal not found.", StatusCodes.Status404NotFound);

        if (goal.CurrentAmount < request.Amount)
        {
            throw new AppException("invalid_operation", "Insufficient goal balance.");
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        goal.CurrentAmount -= request.Amount;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return ToDto(goal);
    }

    public async Task<IReadOnlyCollection<GoalDto>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        var goals = await db.Goals.Where(x => x.UserId == userId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct);
        return goals.Select(ToDto).ToList();
    }

    private static GoalDto ToDto(Goal goal)
    {
        var progress = goal.TargetAmount == 0 ? 0 : decimal.Round((goal.CurrentAmount / goal.TargetAmount) * 100m, 2);
        return new GoalDto(goal.Id, goal.Name, goal.TargetAmount, goal.CurrentAmount, progress, goal.TargetDateUtc);
    }
}

public sealed class RecurringService(AppDbContext db) : IRecurringService
{
    public async Task<RecurringDto> CreateAsync(CreateRecurringRequest request, Guid userId, CancellationToken ct)
    {
        var entity = new RecurringTransaction
        {
            UserId = userId,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Type = request.Type,
            Amount = request.Amount,
            Frequency = request.Frequency,
            Note = request.Note,
            NextRunAtUtc = request.FirstRunAtUtc
        };

        db.RecurringTransactions.Add(entity);
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<RecurringDto> UpdateAsync(Guid id, UpdateRecurringRequest request, Guid userId, CancellationToken ct)
    {
        var entity = await db.RecurringTransactions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct)
            ?? throw new AppException("not_found", "Recurring transaction not found.", StatusCodes.Status404NotFound);

        entity.Amount = request.Amount;
        entity.Frequency = request.Frequency;
        entity.NextRunAtUtc = request.NextRunAtUtc;
        entity.IsActive = request.IsActive;
        entity.Note = request.Note;
        await db.SaveChangesAsync(ct);

        return ToDto(entity);
    }

    public async Task<IReadOnlyCollection<RecurringDto>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        return await db.RecurringTransactions
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.NextRunAtUtc)
            .Select(x => new RecurringDto(x.Id, x.AccountId, x.CategoryId, x.Type, x.Amount, x.Frequency, x.NextRunAtUtc, x.IsActive, x.Note))
            .ToListAsync(ct);
    }

    public async Task<int> ProcessDueTransactionsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var due = await db.RecurringTransactions
            .Where(x => x.IsActive && x.NextRunAtUtc <= now)
            .OrderBy(x => x.NextRunAtUtc)
            .ToListAsync(ct);

        var createdCount = 0;

        foreach (var recurring in due)
        {
            var scheduledRun = recurring.NextRunAtUtc;
            var exists = await db.Transactions.AnyAsync(
                x => x.UserId == recurring.UserId && x.SourceRecurringId == recurring.Id && x.SourceRunAtUtc == scheduledRun,
                ct);

            if (!exists)
            {
                var transaction = new Transaction
                {
                    UserId = recurring.UserId,
                    AccountId = recurring.AccountId,
                    CategoryId = recurring.CategoryId,
                    Type = recurring.Type,
                    Amount = recurring.Amount,
                    Note = recurring.Note,
                    SourceRecurringId = recurring.Id,
                    SourceRunAtUtc = scheduledRun,
                    TransactionDateUtc = scheduledRun
                };

                db.Transactions.Add(transaction);
                var account = await db.Accounts.FirstOrDefaultAsync(x => x.Id == recurring.AccountId && x.UserId == recurring.UserId, ct);
                if (account is not null)
                {
                    account.Balance += transaction.Type == TransactionType.Expense ? -transaction.Amount : transaction.Amount;
                }

                createdCount++;
            }

            recurring.LastRunAtUtc = scheduledRun;
            recurring.NextRunAtUtc = ServiceHelpers.CalculateNextRun(scheduledRun, recurring.Frequency);
        }

        if (createdCount > 0 || due.Count > 0)
        {
            await db.SaveChangesAsync(ct);
        }

        return createdCount;
    }

    private static RecurringDto ToDto(RecurringTransaction x) => new(x.Id, x.AccountId, x.CategoryId, x.Type, x.Amount, x.Frequency, x.NextRunAtUtc, x.IsActive, x.Note);
}

public sealed class ReportService(AppDbContext db) : IReportService
{
    public async Task<IReadOnlyCollection<CategorySpendDto>> GetCategorySpendAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct)
    {
        var query = from t in db.Transactions
                    join c in db.Categories on t.CategoryId equals c.Id into cat
                    from c in cat.DefaultIfEmpty()
                    where t.UserId == userId && t.Type == TransactionType.Expense && t.TransactionDateUtc >= fromUtc && t.TransactionDateUtc <= toUtc
                    group new { t, c } by new { t.CategoryId, Name = c == null ? "Uncategorized" : c.Name } into g
                    orderby g.Sum(x => x.t.Amount) descending
                    select new CategorySpendDto(g.Key.CategoryId ?? Guid.Empty, g.Key.Name, g.Sum(x => x.t.Amount));

        return await query.ToListAsync(ct);
    }

    public async Task<IncomeExpenseDto> GetIncomeExpenseAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct)
    {
        var income = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Income && x.TransactionDateUtc >= fromUtc && x.TransactionDateUtc <= toUtc).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;
        var expense = await db.Transactions.Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.TransactionDateUtc >= fromUtc && x.TransactionDateUtc <= toUtc).SumAsync(x => (decimal?)x.Amount, ct) ?? 0;
        return new IncomeExpenseDto(income, expense, income - expense);
    }

    public async Task<IReadOnlyCollection<BalanceTrendPoint>> GetBalanceTrendAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct)
    {
        var tx = await db.Transactions
            .Where(x => x.UserId == userId && x.TransactionDateUtc >= fromUtc && x.TransactionDateUtc <= toUtc)
            .OrderBy(x => x.TransactionDateUtc)
            .ToListAsync(ct);

        var running = 0m;
        var points = new List<BalanceTrendPoint>(tx.Count);

        foreach (var item in tx)
        {
            running += item.Type == TransactionType.Expense || item.Type == TransactionType.TransferOut ? -item.Amount : item.Amount;
            points.Add(new BalanceTrendPoint(item.TransactionDateUtc, running));
        }

        return points;
    }

    public async Task<GoalsOverviewDto> GetGoalsOverviewAsync(Guid userId, CancellationToken ct)
    {
        var goals = await db.Goals.Where(x => x.UserId == userId).ToListAsync(ct);
        var completed = goals.Count(x => x.CurrentAmount >= x.TargetAmount);
        return new GoalsOverviewDto(
            goals.Count,
            completed,
            goals.Sum(x => x.TargetAmount),
            goals.Sum(x => x.CurrentAmount));
    }

    public async Task<DashboardDto> GetDashboardAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct)
    {
        var incomeExpense = await GetIncomeExpenseAsync(userId, fromUtc, toUtc, ct);
        var spend = await GetCategorySpendAsync(userId, fromUtc, toUtc, ct);
        var goals = await GetGoalsOverviewAsync(userId, ct);
        var totalBalance = await db.Accounts.Where(x => x.UserId == userId && !x.IsArchived).SumAsync(x => (decimal?)x.Balance, ct) ?? 0;

        return new DashboardDto(incomeExpense, spend.Take(5).ToList(), goals, totalBalance);
    }
}
