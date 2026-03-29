namespace PFT.Backend.Common;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public ApiError? Error { get; init; }
    public string TraceId { get; init; } = string.Empty;

    public static ApiResponse<T> Ok(T data, string traceId) => new()
    {
        Success = true,
        Data = data,
        TraceId = traceId
    };

    public static ApiResponse<T> Fail(string code, string message, string traceId, object? details = null) => new()
    {
        Success = false,
        Error = new ApiError(code, message, details),
        TraceId = traceId
    };
}

public sealed record ApiError(string Code, string Message, object? Details);

public sealed class PagedResult<T>
{
    public required IReadOnlyCollection<T> Items { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public required int TotalCount { get; init; }
}
