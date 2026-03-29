using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Rules;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class RulesController(IRuleService ruleService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<RuleDto>>>> GetAll(CancellationToken ct)
    {
        var data = await ruleService.GetAllAsync(UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<RuleDto>>> Create([FromBody] CreateRuleRequest request, CancellationToken ct)
    {
        var data = await ruleService.CreateAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RuleDto>>> Update([FromRoute] Guid id, [FromBody] UpdateRuleRequest request, CancellationToken ct)
    {
        var data = await ruleService.UpdateAsync(id, request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete([FromRoute] Guid id, CancellationToken ct)
    {
        await ruleService.DeleteAsync(id, UserId, ct);
        return NoContentEnvelope();
    }
}
