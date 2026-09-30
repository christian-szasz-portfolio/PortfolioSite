namespace Admin.Api.Http;

using System.Net;

/// <summary>Refuses anything that did not come from this machine.</summary>
/// <remarks>The second lock behind the loopback bind, and an unknown address is refused.</remarks>
public sealed class LoopbackOnlyMiddleware(RequestDelegate next, ILogger<LoopbackOnlyMiddleware> logger)
{
    public Task InvokeAsync(HttpContext context)
    {
        IPAddress? caller = context.Connection.RemoteIpAddress;

        if (caller is not null && IPAddress.IsLoopback(caller))
        {
            return next(context);
        }

        logger.LogWarning("Refused an admin request from {Caller}.", caller?.ToString() ?? "an unknown address");

        context.Response.StatusCode = StatusCodes.Status403Forbidden;

        return Task.CompletedTask;
    }
}
