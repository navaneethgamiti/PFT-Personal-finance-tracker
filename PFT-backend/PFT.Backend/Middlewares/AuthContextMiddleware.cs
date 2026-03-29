using PFT.Backend.Common.Exceptions;

namespace PFT.Backend.Middlewares;

public sealed class AuthContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirst("userId")?.Value;
            if (!Guid.TryParse(userId, out _))
            {
                throw new AppException("unauthorized", "Invalid authentication token.", StatusCodes.Status401Unauthorized);
            }
        }

        await next(context);
    }
}
