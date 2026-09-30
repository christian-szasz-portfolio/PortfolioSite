namespace Analytics.Infrastructure.Usage;

using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;
using Analytics.Infrastructure.Configuration;
using Common.Diagnostics.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

/// <summary>Moves counted usage into the day's rows, on an interval and again when the host stops.</summary>
/// <remarks>The same write-behind shape the view counter uses, for the same reason.</remarks>
public sealed class UsageFlushService(
    IAnalyticsWindow window,
    IUsageStore store,
    IOptions<CounterOptions> options,
    TimeProvider time,
    IHeartbeatLog heartbeats,
    ILogger<UsageFlushService> logger) : BackgroundService
{
    /// <summary>The name this worker reports under in the readiness check.</summary>
    public const string Worker = "usage-flush";

    /// <summary>How long the last flush may take, once the host has stopped.</summary>
    private static readonly TimeSpan ShutdownFlushTimeout = TimeSpan.FromSeconds(10);

    /// <summary>Stops taking new work, then writes whatever was counted but not yet stored.</summary>
    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await base.StopAsync(cancellationToken);

        using CancellationTokenSource shutdown = new(ShutdownFlushTimeout);
        await this.FlushAsync(shutdown.Token);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        TimeSpan interval = options.Value.FlushInterval;

        // Once before the first wait, so a worker that started is visible immediately rather
        // than one interval later.
        heartbeats.Beat(Worker, interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(interval, time, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            await this.FlushAsync(stoppingToken);
            heartbeats.Beat(Worker, interval);
        }
    }

    /// <summary>Writes what is counted into today's rows, handing it back to the window if the write fails.</summary>
    /// <remarks>A flush that straddles midnight credits its last seconds to the new day.</remarks>
    private async Task FlushAsync(CancellationToken cancellationToken)
    {
        AnalyticsSummary taken = window.Take();
        if (!taken.HasAnything)
        {
            return;
        }

        DateOnly day = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);

        try
        {
            await store.ApplyAsync(day, taken, cancellationToken);
        }
        catch (Exception ex)
        {
            window.Restore(taken);

            if (ex is OperationCanceledException)
            {
                throw;
            }

            logger.LogError(
                ex,
                "Could not store {Count} interactions and {Views} views; they stay buffered.",
                taken.Interactions,
                taken.Views);
        }
    }
}
