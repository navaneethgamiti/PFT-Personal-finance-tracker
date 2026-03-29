using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Insights;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class InsightsController(IInsightsService insightsService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpGet("health-score")]
    public async Task<ActionResult<ApiResponse<HealthScoreDto>>> HealthScore(CancellationToken ct)
    {
        var data = await insightsService.GetHealthScoreAsync(UserId, ct);
        return OkEnvelope(data);
    }

    [HttpGet("cashflow-forecast")]
    public async Task<ActionResult<ApiResponse<CashFlowForecastDto>>> Forecast([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var data = await insightsService.GetCashFlowForecastAsync(UserId, days, ct);
        return OkEnvelope(data);
    }

    [HttpGet("savings-rate-trend")]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<SavingsRatePointDto>>>> SavingsTrend([FromQuery] int months = 6, CancellationToken ct = default)
    {
        var data = await insightsService.GetSavingsRateTrendAsync(UserId, months, ct);
        return OkEnvelope(data);
    }

    [HttpGet("net-worth-trend")]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<NetWorthPointDto>>>> NetWorthTrend([FromQuery] int months = 6, CancellationToken ct = default)
    {
        var data = await insightsService.GetNetWorthTrendAsync(UserId, months, ct);
        return OkEnvelope(data);
    }
}
