namespace Analytics.Infrastructure.Retention;

using Analytics.Domain.Usage.Abstractions;
using Analytics.Infrastructure.Configuration;
using Common.Diagnostics;
using Common.Diagnostics.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

/// <summary>Drops stored days once they are older than the site says it keeps them.</summary>
/// <remarks>At startup as well as daily, because a host restarted every day would never reach the wait.</remarks>
public sealed partial class RetentionService(
    IUsageRetention usage,
    ILogRetention logs,
    IOptions<CounterOptions> counter,
    IOptions<DiagnosticsOptions> diagnostics,
    TimeProvider time,
    IHeartbeatLog heartbeats,
    ILogger<RetentionService> logger) : BackgroundService
{
    /// <summary>The name this worker reports under in the readiness check.</summary>
    public const string Worker = "retention";

    /// <summary>How often the windows are enforced. Daily is as often as a day can expire.</summary>
    private static readonly TimeSpan Every = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await this.SweepAsync(stoppingToken);
            heartbeats.Beat(Worker, Every);

            try
            {
                await Task.Delay(Every, time, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    /// <summary>Two windows, because usage and captured entries are kept for their own reasons.</summary>
    private async Task SweepAsync(CancellationToken cancellationToken)
    {
        DateOnly today = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);

        int usageDays = counter.Value.UsageRetentionDays;
        int logDays = diagnostics.Value.LogRetentionDays;

        await this.DropAsync(
            () => usage.DropBeforeAsync(today.AddDays(-usageDays), cancellationToken),
            "usage",
            usageDays);

        await this.DropAsync(
            () => logs.DropBeforeAsync(today.AddDays(-logDays), cancellationToken),
            "entries",
            logDays);
    }

    private async Task DropAsync(Func<Task<int>> drop, string what, int window)
    {
        try
        {
            int dropped = await drop();

            if (dropped > 0)
            {
                Dropped(logger, dropped, what, window);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Logged and left for tomorrow. Storage being unreachable must not take the API down,
            // and a day that outlives its window by a few hours is the smaller problem.
            logger.LogError(ex, "Could not drop {What} past the {Window} day window.", what, window);
        }
    }

    // Source generated, so the numbers are not formatted when Information is switched off.
    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Dropped {Days} days of {What} past the {Window} day window.")]
    private static partial void Dropped(ILogger logger, int days, string what, int window);
}
