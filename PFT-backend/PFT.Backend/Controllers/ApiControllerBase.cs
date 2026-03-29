using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public abstract class ApiControllerBase(IUserContext userContext) : ControllerBase
{
    protected Guid UserId => userContext.UserId;

    protected ActionResult<ApiResponse<T>> OkEnvelope<T>(T data) => Ok(ApiResponse<T>.Ok(data, HttpContext.TraceIdentifier));

    protected ActionResult<ApiResponse<object>> NoContentEnvelope()
        => Ok(ApiResponse<object>.Ok(new { message = "success" }, HttpContext.TraceIdentifier));
}
