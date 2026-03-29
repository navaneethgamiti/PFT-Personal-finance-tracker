using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Transactions;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class TransactionsController(ITransactionService transactionService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<TransactionDto>>> Create([FromBody] CreateTransactionRequest request, CancellationToken ct)
    {
        var data = await transactionService.CreateAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<TransactionDto>>> Update([FromRoute] Guid id, [FromBody] UpdateTransactionRequest request, CancellationToken ct)
    {
        var data = await transactionService.UpdateAsync(id, request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete([FromRoute] Guid id, CancellationToken ct)
    {
        await transactionService.DeleteAsync(id, UserId, ct);
        return NoContentEnvelope();
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<TransactionDto>>>> GetPaged([FromQuery] TransactionListQuery query, CancellationToken ct)
    {
        var data = await transactionService.GetPagedAsync(query, UserId, ct);
        return OkEnvelope(data);
    }
}
