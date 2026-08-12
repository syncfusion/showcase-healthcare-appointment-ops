using HealthcareAppointmentOps.Application.Abstractions;

namespace HealthcareAppointmentOps.Api.Demo;

/// <summary>
/// Reads the per-visitor demo-session token from the <c>X-Demo-Session</c>
/// request header. Clients generate a token in memory on load and send it with
/// every request; a page refresh mints a new token, giving that visitor a clean
/// overlay (only the real, seed-derived database rows).
/// </summary>
public sealed class HttpDemoSessionAccessor(IHttpContextAccessor accessor) : IDemoSessionAccessor
{
    public const string HeaderName = "X-Demo-Session";

    public string SessionKey
    {
        get
        {
            var value = accessor.HttpContext?.Request.Headers[HeaderName].ToString();
            return string.IsNullOrWhiteSpace(value) ? "anonymous" : value!;
        }
    }
}
