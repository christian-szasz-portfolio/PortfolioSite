namespace Analytics.Api.Health;

using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Models;
using Microsoft.Extensions.Diagnostics.HealthChecks;

/// <summary>Reports whether the background workers are running, from the beats they leave behind.</summary>
/// <remarks>Degraded rather than unhealthy, because a stalled flush does not stop the API answering.</remarks>
public sealed class WorkerHealthCheck(IHeartbeatLog heartbeats, TimeProvider time) : IHealthCheck
{
    /// <summary>The name this check reports under.</summary>
    public const string Name = "workers";

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        DateTimeOffset now = time.GetUtcNow();
        IReadOnlyList<Heartbeat> beats = heartbeats.Latest();

        Dictionary<string, object> data = beats.ToDictionary(
            beat => beat.Worker,
            beat => (object)Describe(beat, now),
            StringComparer.Ordinal);

        if (beats.Count == 0)
        {
            return Task.FromResult(HealthCheckResult.Healthy("No worker has reported yet.", data));
        }

        string[] overdue = [.. beats.Where(beat => beat.IsOverdue(now)).Select(beat => beat.Worker)];

        return Task.FromResult(overdue.Length == 0
            ? HealthCheckResult.Healthy($"{beats.Count} worker(s) beating.", data)
            : HealthCheckResult.Degraded($"Overdue: {string.Join(", ", overdue)}.", data: data));
    }

    /// <summary>Numbers rather than a sentence, so the dashboard reads the same payload a probe does.</summary>
    private static WorkerBeat Describe(Heartbeat beat, DateTimeOffset now)
    {
        return new WorkerBeat(
            (long)beat.Age(now).TotalSeconds,
            (long)beat.Period.TotalSeconds,
            beat.IsOverdue(now));
    }
}
