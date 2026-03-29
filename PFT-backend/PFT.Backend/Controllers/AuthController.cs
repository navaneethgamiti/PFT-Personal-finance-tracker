using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Auth;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService, IUserContext userContext) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var data = await authService.RegisterAsync(request, ct);
        return Ok(ApiResponse<AuthResponse>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var data = await authService.LoginAsync(request, ct);
        return Ok(ApiResponse<AuthResponse>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var data = await authService.RefreshAsync(request, ct);
        return Ok(ApiResponse<AuthResponse>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        var token = await authService.ForgotPasswordAsync(request, ct);
        return Ok(ApiResponse<object>.Ok(new { token }, HttpContext.TraceIdentifier));
    }

    [HttpPost("reset-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await authService.ResetPasswordAsync(userContext.UserId, request, ct);
        return Ok(ApiResponse<object>.Ok(new { message = "Password reset successful" }, HttpContext.TraceIdentifier));
    }
}
