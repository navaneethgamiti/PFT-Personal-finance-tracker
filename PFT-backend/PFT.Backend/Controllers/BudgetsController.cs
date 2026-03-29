using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Budgets;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class BudgetsController(IBudgetService budgetService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<BudgetDto>>> Upsert([FromBody] UpsertBudgetRequest request, CancellationToken ct)
    {
        var data = await budgetService.UpsertAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<BudgetDto>>>> GetMonthly([FromQuery] DateTime monthStartUtc, CancellationToken ct)
    {
        var data = await budgetService.GetMonthlyAsync(monthStartUtc, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost("duplicate-previous")]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<BudgetDto>>>> Duplicate([FromQuery] DateTime monthStartUtc, CancellationToken ct)
    {
        var data = await budgetService.DuplicatePreviousMonthAsync(monthStartUtc, UserId, ct);
        return OkEnvelope(data);
    }
}
