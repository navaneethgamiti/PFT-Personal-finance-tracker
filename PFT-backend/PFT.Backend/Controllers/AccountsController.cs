using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Accounts;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class AccountsController(IAccountService accountService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<AccountBalanceDto>>> Create([FromBody] CreateAccountRequest request, CancellationToken ct)
    {
        var data = await accountService.CreateAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpGet("balances")]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<AccountBalanceDto>>>> GetBalances(CancellationToken ct)
    {
        var data = await accountService.GetBalancesAsync(UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost("transfer")]
    public async Task<ActionResult<ApiResponse<object>>> Transfer([FromBody] TransferFundsRequest request, CancellationToken ct)
    {
        await accountService.TransferAsync(request, UserId, ct);
        return NoContentEnvelope();
    }
}
