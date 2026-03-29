using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Reports;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class ReportsController(IReportService reportService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpGet("category-spend")]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<CategorySpendDto>>>> CategorySpend([FromQuery] DateTime fromUtc, [FromQuery] DateTime toUtc, CancellationToken ct)
    {
        var data = await reportService.GetCategorySpendAsync(UserId, fromUtc, toUtc, ct);
        return OkEnvelope(data);
    }

    [HttpGet("income-vs-expense")]
    public async Task<ActionResult<ApiResponse<IncomeExpenseDto>>> IncomeVsExpense([FromQuery] DateTime fromUtc, [FromQuery] DateTime toUtc, CancellationToken ct)
    {
        var data = await reportService.GetIncomeExpenseAsync(UserId, fromUtc, toUtc, ct);
        return OkEnvelope(data);
    }

    [HttpGet("balance-trend")]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<BalanceTrendPoint>>>> BalanceTrend([FromQuery] DateTime fromUtc, [FromQuery] DateTime toUtc, CancellationToken ct)
    {
        var data = await reportService.GetBalanceTrendAsync(UserId, fromUtc, toUtc, ct);
        return OkEnvelope(data);
    }

    [HttpGet("goals-overview")]
    public async Task<ActionResult<ApiResponse<GoalsOverviewDto>>> GoalsOverview(CancellationToken ct)
    {
        var data = await reportService.GetGoalsOverviewAsync(UserId, ct);
        return OkEnvelope(data);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardDto>>> Dashboard([FromQuery] DateTime fromUtc, [FromQuery] DateTime toUtc, CancellationToken ct)
    {
        var data = await reportService.GetDashboardAsync(UserId, fromUtc, toUtc, ct);
        return OkEnvelope(data);
    }
}
