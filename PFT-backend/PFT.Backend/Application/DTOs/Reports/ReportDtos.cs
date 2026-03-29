namespace PFT.Backend.Application.DTOs.Reports;

public record CategorySpendDto(Guid CategoryId, string CategoryName, decimal TotalAmount);

public record IncomeExpenseDto(decimal TotalIncome, decimal TotalExpense, decimal Net);

public record BalanceTrendPoint(DateTime DateUtc, decimal Balance);

public record GoalsOverviewDto(int TotalGoals, int CompletedGoals, decimal TotalTarget, decimal TotalSaved);

public record DashboardDto(
    IncomeExpenseDto IncomeVsExpense,
    IReadOnlyCollection<CategorySpendDto> TopCategories,
    GoalsOverviewDto GoalsOverview,
    decimal TotalBalance);
