namespace Analytics.Infrastructure.Buffering;

using Analytics.Domain.Abstractions.Views;
using Analytics.Infrastructure.Configuration;
using Common.Diagnostics.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

/// <summary>Drains the buffered counts into storage, on a nudge or on the flush interval.</summary>
public sealed class ViewFlushService(
    IViewAccumulator durable,
    IViewBuffer buffer,
    IOptions<CounterOptions> options,
    IHeartbeatLog heartbeats,
    ILogger<ViewFlushService> logger) : BackgroundService
{
    /// <summary>The name this worker reports under in the readiness check.</summary>
    public const string Worker = "views-flush";

    /// <summary>How long the last flush may take, once the host has stopped waiting for views.</summary>
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
            bool woken = await this.WaitForWorkAsync(interval, stoppingToken);
            if (!woken && stoppingToken.IsCancellationRequested)
            {
                return;
            }

            await this.FlushAsync(stoppingToken);
            heartbeats.Beat(Worker, interval);
        }
    }

    /// <summary>Waits for a view or for the interval, and returns false only when the host is stopping.</summary>
    private async Task<bool> WaitForWorkAsync(TimeSpan interval, CancellationToken cancellationToken)
    {
        using CancellationTokenSource timer = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timer.CancelAfter(interval);

        try
        {
            await buffer.WaitForViewsAsync(timer.Token);
        }
        catch (OperationCanceledException)
        {
            // Either the interval elapsed, which is a reason to flush, or the host is stopping,
            // which is not: the caller tells them apart from the stopping token.
            return !cancellationToken.IsCancellationRequested;
        }

        return true;
    }

    /// <summary>Writes everything counted so far, handing it back to the buffer if the write fails.</summary>
    /// <remarks>Taking and writing happen under one hold; see <see cref="ViewFlushGate"/>.</remarks>
    private async Task FlushAsync(CancellationToken cancellationToken)
    {
        using IDisposable hold = await buffer.HoldAsync(cancellationToken);

        IReadOnlyDictionary<string, long> batch = buffer.Take();
        if (batch.Count == 0)
        {
            return;
        }

        try
        {
            await durable.ApplyAsync(batch, cancellationToken);
        }
        catch (Exception ex)
        {
            buffer.Restore(batch);

            if (ex is OperationCanceledException)
            {
                throw;
            }

            logger.LogError(ex, "Could not flush {Count} buffered countries; they stay buffered.", batch.Count);
        }
    }
}
