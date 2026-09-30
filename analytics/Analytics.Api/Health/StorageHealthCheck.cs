namespace Analytics.Api.Health;

using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Views;
using Microsoft.Extensions.Diagnostics.HealthChecks;

/// <summary>Reads one row to prove the table is reachable and answering.</summary>
/// <remarks>One point read on a probe's schedule, and a missing row is a healthy answer.</remarks>
public sealed class StorageHealthCheck(ICounterTable table) : IHealthCheck
{
    /// <summary>The name this check reports under.</summary>
    public const string Name = "storage";

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            CounterRow? row = await table.TryGetAsync(
                CounterRowKey.Partition, CounterRowKey.Total, cancellationToken);

            return HealthCheckResult.Healthy(row is null ? "Reachable, no views yet." : "Reachable.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // The message, not the exception: this is answered over HTTP, and a stack trace from
            // a storage client names accounts, endpoints and sometimes a signature.
            return HealthCheckResult.Unhealthy($"Table unreachable: {ex.GetType().Name}.");
        }
    }
}
