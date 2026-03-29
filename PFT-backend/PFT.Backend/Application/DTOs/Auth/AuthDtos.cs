using System.ComponentModel.DataAnnotations;

namespace PFT.Backend.Application.DTOs.Auth;

public record RegisterRequest(
    [Required, MaxLength(200)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RefreshTokenRequest([Required] string RefreshToken);

public record ForgotPasswordRequest([Required, EmailAddress] string Email);

public record ResetPasswordRequest(
    [Required] string Token,
    [Required, MinLength(8)] string NewPassword);

public record AuthResponse(string AccessToken, string RefreshToken, DateTime ExpiresAtUtc);

