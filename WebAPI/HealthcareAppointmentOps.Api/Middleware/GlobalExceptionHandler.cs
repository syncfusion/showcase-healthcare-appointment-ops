using System.Text.Json;
using System.Text.Json.Serialization;
using HealthcareAppointmentOps.Application;
using HealthcareAppointmentOps.Infrastructure;
using Microsoft.Extensions.Hosting;

namespace HealthcareAppointmentOps.Api;

public class GlobalExceptionHandler(
    RequestDelegate next,
    ILogger<GlobalExceptionHandler> logger,
    IWebHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception occurred. TraceId={TraceId}", context.TraceIdentifier);
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var detail = env.IsDevelopment()
            ? exception.Message
            : "An unexpected error occurred. Please contact support if the problem persists.";

        var response = new
        {
            status = "error",
            error = new
            {
                title = "An unexpected error occurred.",
                detail,
                traceId = context.TraceIdentifier
            }
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
