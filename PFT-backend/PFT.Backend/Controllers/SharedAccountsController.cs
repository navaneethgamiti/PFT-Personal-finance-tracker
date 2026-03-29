using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Shared;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class SharedAccountsController(ISharedAccountsService sharedService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpGet("{accountId:guid}/members")]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<AccountMemberDto>>>> Members([FromRoute] Guid accountId, CancellationToken ct)
    {
        var data = await sharedService.GetMembersAsync(accountId, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost("members")]
    public async Task<ActionResult<ApiResponse<AccountMemberDto>>> AddMember([FromBody] AddAccountMemberRequest request, CancellationToken ct)
    {
        var data = await sharedService.AddMemberAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPut("members/{memberId:guid}/role")]
    public async Task<ActionResult<ApiResponse<AccountMemberDto>>> UpdateRole([FromRoute] Guid memberId, [FromBody] UpdateAccountMemberRoleRequest request, CancellationToken ct)
    {
        var data = await sharedService.UpdateRoleAsync(memberId, request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpDelete("members/{memberId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Remove([FromRoute] Guid memberId, CancellationToken ct)
    {
        await sharedService.RemoveMemberAsync(memberId, UserId, ct);
        return NoContentEnvelope();
    }
}
