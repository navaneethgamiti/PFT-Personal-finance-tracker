using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PFT.Backend.Application.DTOs.Accounts;
using PFT.Backend.Application.DTOs.Auth;
using PFT.Backend.Application.DTOs.Budgets;
using PFT.Backend.Application.DTOs.Categories;
using PFT.Backend.Application.DTOs.Goals;
using PFT.Backend.Application.DTOs.Recurring;
using PFT.Backend.Application.DTOs.Reports;
using PFT.Backend.Application.DTOs.Transactions;
using PFT.Backend.Common;
using PFT.Backend.Common.Exceptions;
using PFT.Backend.Domain.Entities;
using PFT.Backend.Infrastructure.Data;

namespace PFT.Backend.Application.Interfaces;

public interface IUserContext
{
    Guid UserId { get; }
}

public interface IPasswordHashService
{
    (string Hash, string Salt) HashPassword(string password);
    bool Verify(string password, string hash, string salt);
}

public interface ITokenService
{
    string CreateAccessToken(User user);
    string CreateSecureToken();
    string HashToken(string token);
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken ct);
    Task<string> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct);
    Task ResetPasswordAsync(Guid userId, ResetPasswordRequest request, CancellationToken ct);
}

public interface IAccountService
{
    Task<AccountBalanceDto> CreateAsync(CreateAccountRequest request, Guid userId, CancellationToken ct);
    Task<IReadOnlyCollection<AccountBalanceDto>> GetBalancesAsync(Guid userId, CancellationToken ct);
    Task TransferAsync(TransferFundsRequest request, Guid userId, CancellationToken ct);
}

public interface ICategoryService
{
    Task<IReadOnlyCollection<CategoryDto>> GetAllAsync(Guid userId, CancellationToken ct);
    Task<CategoryDto> CreateAsync(CreateCategoryRequest request, Guid userId, CancellationToken ct);
    Task<CategoryDto> UpdateAsync(Guid categoryId, UpdateCategoryRequest request, Guid userId, CancellationToken ct);
}

public interface ITransactionService
{
    Task<TransactionDto> CreateAsync(CreateTransactionRequest request, Guid userId, CancellationToken ct);
    Task<TransactionDto> UpdateAsync(Guid id, UpdateTransactionRequest request, Guid userId, CancellationToken ct);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct);
    Task<PagedResult<TransactionDto>> GetPagedAsync(TransactionListQuery query, Guid userId, CancellationToken ct);
}

public interface IBudgetService
{
    Task<BudgetDto> UpsertAsync(UpsertBudgetRequest request, Guid userId, CancellationToken ct);
    Task<IReadOnlyCollection<BudgetDto>> GetMonthlyAsync(DateTime monthStartUtc, Guid userId, CancellationToken ct);
    Task<IReadOnlyCollection<BudgetDto>> DuplicatePreviousMonthAsync(DateTime monthStartUtc, Guid userId, CancellationToken ct);
}

public interface IGoalService
{
    Task<GoalDto> CreateAsync(CreateGoalRequest request, Guid userId, CancellationToken ct);
    Task<GoalDto> UpdateAsync(Guid goalId, UpdateGoalRequest request, Guid userId, CancellationToken ct);
    Task<GoalDto> ContributeAsync(Guid goalId, GoalContributionRequest request, Guid userId, CancellationToken ct);
    Task<GoalDto> WithdrawAsync(Guid goalId, GoalContributionRequest request, Guid userId, CancellationToken ct);
    Task<IReadOnlyCollection<GoalDto>> GetAllAsync(Guid userId, CancellationToken ct);
}

public interface IRecurringService
{
    Task<RecurringDto> CreateAsync(CreateRecurringRequest request, Guid userId, CancellationToken ct);
    Task<RecurringDto> UpdateAsync(Guid id, UpdateRecurringRequest request, Guid userId, CancellationToken ct);
    Task<IReadOnlyCollection<RecurringDto>> GetAllAsync(Guid userId, CancellationToken ct);
    Task<int> ProcessDueTransactionsAsync(CancellationToken ct);
}

public interface IReportService
{
    Task<IReadOnlyCollection<CategorySpendDto>> GetCategorySpendAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct);
    Task<IncomeExpenseDto> GetIncomeExpenseAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct);
    Task<IReadOnlyCollection<BalanceTrendPoint>> GetBalanceTrendAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct);
    Task<GoalsOverviewDto> GetGoalsOverviewAsync(Guid userId, CancellationToken ct);
    Task<DashboardDto> GetDashboardAsync(Guid userId, DateTime fromUtc, DateTime toUtc, CancellationToken ct);
}

public sealed class UserContext(IHttpContextAccessor accessor) : IUserContext
{
    public Guid UserId
    {
        get
        {
            var claim = accessor.HttpContext?.User.FindFirst("userId")?.Value;
            return Guid.TryParse(claim, out var id)
                ? id
                : throw new AppException("unauthorized", "Missing user identity.", StatusCodes.Status401Unauthorized);
        }
    }
}

public sealed class PasswordHashService : IPasswordHashService
{
    public (string Hash, string Salt) HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public bool Verify(string password, string hash, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        var computed = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, 100_000, HashAlgorithmName.SHA256, 32);
        return Convert.ToBase64String(computed) == hash;
    }
}

public sealed class TokenService(IConfiguration config) : ITokenService
{
    public string CreateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(Convert.ToInt32(config["Jwt:AccessTokenMinutes"] ?? "30"));

        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:
            [
                new("userId", user.Id.ToString()),
                new("email", user.Email)
            ],
            expires: expires,
            signingCredentials: creds);

        return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
    }

    public string CreateSecureToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}

public static class ServiceHelpers
{
    public static DateTime EnsureMonthStart(DateTime dt) => new(dt.Year, dt.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    public static DateTime CalculateNextRun(DateTime current, RecurringFrequency frequency) => frequency switch
    {
        RecurringFrequency.Daily => current.AddDays(1),
        RecurringFrequency.Weekly => current.AddDays(7),
        RecurringFrequency.Monthly => current.AddMonths(1),
        _ => current.AddDays(1)
    };
}
