using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Goals;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class GoalsController(IGoalService goalService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<GoalDto>>>> GetAll(CancellationToken ct)
    {
        var data = await goalService.GetAllAsync(UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<GoalDto>>> Create([FromBody] CreateGoalRequest request, CancellationToken ct)
    {
        var data = await goalService.CreateAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<GoalDto>>> Update([FromRoute] Guid id, [FromBody] UpdateGoalRequest request, CancellationToken ct)
    {
        var data = await goalService.UpdateAsync(id, request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost("{id:guid}/contribute")]
    public async Task<ActionResult<ApiResponse<GoalDto>>> Contribute([FromRoute] Guid id, [FromBody] GoalContributionRequest request, CancellationToken ct)
    {
        var data = await goalService.ContributeAsync(id, request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost("{id:guid}/withdraw")]
    public async Task<ActionResult<ApiResponse<GoalDto>>> Withdraw([FromRoute] Guid id, [FromBody] GoalContributionRequest request, CancellationToken ct)
    {
        var data = await goalService.WithdrawAsync(id, request, UserId, ct);
        return OkEnvelope(data);
    }
}
