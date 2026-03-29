namespace PFT.Backend.Application.DTOs.Insights;

public record HealthScoreDto(int Score, decimal SavingsRatePercent, decimal BudgetAdherencePercent, decimal CashBufferMonths, decimal ExpenseStabilityPercent);

public record ForecastPointDto(DateTime DateUtc, decimal ProjectedBalance);

public record CashFlowForecastDto(decimal CurrentBalance, decimal ForecastedEndBalance, decimal SafeToSpend, bool HasRisk, IReadOnlyCollection<string> RiskWarnings, IReadOnlyCollection<ForecastPointDto> Trend);

public record SavingsRatePointDto(DateTime MonthStartUtc, decimal SavingsRatePercent);

public record NetWorthPointDto(DateTime MonthStartUtc, decimal NetWorth);
