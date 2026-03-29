namespace PFT.Backend.Common.Exceptions;

public class AppException : Exception
{
    public string Code { get; }
    public int StatusCode { get; }
    public object? Details { get; }

    public AppException(string code, string message, int statusCode = StatusCodes.Status400BadRequest, object? details = null)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
        Details = details;
    }
}
