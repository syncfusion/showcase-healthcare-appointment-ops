using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models;

public class ProblemDetails
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("detail")]
    public string? Detail { get; set; }

    [JsonPropertyName("traceId")]
    public string? TraceId { get; set; }
}

public class PagingInfo
{
    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("limit")]
    public int Limit { get; set; }

    [JsonPropertyName("offset")]
    public int Offset { get; set; }
}

public class ApiResult<T>
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "error";

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("error")]
    public ProblemDetails? Error { get; set; }

    [JsonPropertyName("paging")]
    public PagingInfo? Paging { get; set; }

    [JsonIgnore]
    public bool IsOk => Status == "ok";
}

public class PagedResult<T>
{
    [JsonPropertyName("items")]
    public List<T> Items { get; set; } = new();

    [JsonPropertyName("paging")]
    public PagingInfo Paging { get; set; } = new();
}
