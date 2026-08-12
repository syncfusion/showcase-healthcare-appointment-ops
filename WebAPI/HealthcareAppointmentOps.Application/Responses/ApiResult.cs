namespace HealthcareAppointmentOps.Application.Responses;

public class ProblemDetails
{
    public string? Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public string? TraceId { get; set; }
}

public class PagingInfo
{
    public int Total { get; set; }
    public int Limit { get; set; }
    public int Offset { get; set; }
}

public class ApiResult<T>
{
    public string Status { get; set; } = "ok";
    public T? Data { get; set; }
    public ProblemDetails? Error { get; set; }
    public PagingInfo? Paging { get; set; }

    public static ApiResult<T> Success(T data, PagingInfo? paging = null) =>
        new() { Status = "ok", Data = data, Paging = paging };

    public static ApiResult<T> Failure(string title, string? detail = null, string? type = null) =>
        new() { Status = "error", Error = new ProblemDetails { Title = title, Detail = detail, Type = type } };
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = [];
    public PagingInfo Paging { get; set; } = new();
}
