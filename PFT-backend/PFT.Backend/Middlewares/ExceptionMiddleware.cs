using System.Net;
using System.Text.Json;
using PFT.Backend.Common;
using PFT.Backend.Common.Exceptions;

namespace PFT.Backend.Middlewares;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException ex)
        {
            logger.LogWarning(ex, "Application error: {Code}", ex.Code);
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            var payload = ApiResponse<object>.Fail(ex.Code, ex.Message, context.TraceIdentifier, ex.Details);
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled server error");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var payload = ApiResponse<object>.Fail("server_error", "An unexpected error occurred.", context.TraceIdentifier);
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}
