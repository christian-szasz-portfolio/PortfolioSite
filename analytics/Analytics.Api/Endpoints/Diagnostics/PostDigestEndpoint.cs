namespace Analytics.Api.Endpoints.Diagnostics;

using System.Security.Cryptography;
using System.Text;
using Analytics.Infrastructure.Diagnostics;
using Common.Diagnostics.Delivery;
using Common.Diagnostics.Scheduling;
using FastEndpoints;
using Microsoft.Extensions.Options;

/// <summary>Sends the morning's digest, for a host that sleeps rather than waits.</summary>
/// <remarks>
/// A scaled-to-zero host has no worker awake at nine, so a scheduler wakes it here. The hour is
/// still decided in this process, from the configured zone, so the caller can fire on a plain UTC
/// cron and daylight saving stays somebody else's problem.
/// </remarks>
public sealed class PostDigestEndpoint(
    IDigestDispatcher dispatcher,
    IDigestScheduleFactory schedules,
    IOptions<AnalyticsDiagnosticsOptions> options,
    TimeProvider time) : EndpointWithoutRequest<DigestWake>
{
    /// <summary>Where the scheduler knocks. Outside /api, because no browser calls it.</summary>
    public const string Path = "/internal/digest";

    /// <summary>What the caller proves itself with.</summary>
    public const string KeyHeader = "X-Digest-Key";

    /// <summary>Sends whether or not the hour has come, for a person checking it by hand.</summary>
    public const string ForceQuery = "force";

    public override void Configure()
    {
        this.Post(Path);
        this.AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken cancellationToken)
    {
        // No key configured is no endpoint. Answering 404 rather than 500 tells a caller who
        // found the path nothing about whether it is a path at all.
        if (string.IsNullOrWhiteSpace(options.Value.TriggerKey))
        {
            await this.Send.NotFoundAsync(cancellationToken);

            return;
        }

        if (!this.Presented(options.Value.TriggerKey))
        {
            await this.Send.UnauthorizedAsync(cancellationToken);

            return;
        }

        IDigestSchedule schedule = schedules.Create();
        DateTimeOffset now = time.GetUtcNow();
        bool forced = this.HttpContext.Request.Query.ContainsKey(ForceQuery);

        if (!forced && !schedule.IsDue(now))
        {
            // Fired early, which a UTC cron does for half the year. Saying so plainly is what
            // lets the caller fire more often than it needs to and stay correct.
            this.Response = new DigestWake("NotDue", schedule.ReportsOn(now));

            return;
        }

        DateOnly day = schedule.ReportsOn(now);
        DigestOutcome outcome = await dispatcher.SendAsync(day, cancellationToken);

        this.Response = new DigestWake(outcome.ToString(), day);
    }

    /// <summary>Compared in fixed time, so the answer never says how much of a key was right.</summary>
    private bool Presented(string expected)
    {
        if (!this.HttpContext.Request.Headers.TryGetValue(KeyHeader, out Microsoft.Extensions.Primitives.StringValues sent))
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(sent.ToString()), Encoding.UTF8.GetBytes(expected));
    }
}
