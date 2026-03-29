using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Recurring;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class RecurringController(IRecurringService recurringService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<RecurringDto>>>> GetAll(CancellationToken ct)
    {
        var data = await recurringService.GetAllAsync(UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<RecurringDto>>> Create([FromBody] CreateRecurringRequest request, CancellationToken ct)
    {
        var data = await recurringService.CreateAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RecurringDto>>> Update([FromRoute] Guid id, [FromBody] UpdateRecurringRequest request, CancellationToken ct)
    {
        var data = await recurringService.UpdateAsync(id, request, UserId, ct);
        return OkEnvelope(data);
    }
}
