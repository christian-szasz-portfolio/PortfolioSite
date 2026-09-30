namespace Analytics.Tests.Infrastructure.Retention;

using Analytics.Domain.Usage.Abstractions;
using Analytics.Infrastructure.Configuration;
using Analytics.Infrastructure.Retention;
using Analytics.Tests.Fakes;
using Common.Diagnostics;
using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Models;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Xunit;

public sealed class RetentionServiceTests
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 6, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeSweep usage = new();
    private readonly FakeSweep logs = new();
    private readonly FakeTimeProvider time = new(Noon);
    private readonly FakeHeartbeatLog heartbeats = new();

    // At startup as well as on the interval: a host restarted every day would otherwise never
    // reach the wait, and would never drop anything.
    [Fact]
    public async Task SweepsAsSoonAsItStarts()
    {
        await this.SweepAsync(usageDays: 30, logDays: 30);

        Assert.Equal(new DateOnly(2026, 8, 7), Assert.Single(this.usage.Asked));
    }

    /// <summary>Two windows, because usage and captured entries are kept for their own reasons.</summary>
    [Fact]
    public async Task KeepsEachWindowOnItsOwnTerms()
    {
        await this.SweepAsync(usageDays: 30, logDays: 7);

        Assert.Equal(new DateOnly(2026, 8, 7), Assert.Single(this.usage.Asked));
        Assert.Equal(new DateOnly(2026, 8, 30), Assert.Single(this.logs.Asked));
    }

    // Storage being unreachable must not take the API down, and one window failing must not
    // stop the other from being enforced.
    [Fact]
    public async Task SweepsTheEntriesEvenWhenUsageWillNotAnswer()
    {
        this.usage.FailWith = new InvalidOperationException("storage is down");

        await this.SweepAsync(usageDays: 30, logDays: 30);

        Assert.Single(this.logs.Asked);
    }

    [Fact]
    public async Task ReportsThatItSwept()
    {
        await this.SweepAsync(usageDays: 30, logDays: 30);

        Heartbeat beat = Assert.Single(this.heartbeats.Beats);

        Assert.Equal(RetentionService.Worker, beat.Worker);
        Assert.Equal(TimeSpan.FromHours(24), beat.Period);
    }

    /// <summary>Runs the service until its first sweep has happened, then stops it.</summary>
    private async Task SweepAsync(int usageDays, int logDays)
    {
        RetentionService service = this.Build(usageDays, logDays);

        await service.StartAsync(CancellationToken.None);
        await this.logs.Swept.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);
    }

    private RetentionService Build(int usageDays, int logDays)
    {
        CounterOptions counter = new()
        {
            AzureWebJobsStorage = "UseDevelopmentStorage=true",
            UsageRetentionDays = usageDays,
        };

        DiagnosticsOptions diagnostics = new() { LogRetentionDays = logDays };

        return new RetentionService(
            this.usage,
            this.logs,
            Options.Create(counter),
            Options.Create(diagnostics),
            this.time,
            this.heartbeats,
            NullLogger<RetentionService>.Instance);
    }

    /// <summary>Records what it was asked to drop, and can refuse.</summary>
    private sealed class FakeSweep : IUsageRetention, ILogRetention
    {
        public List<DateOnly> Asked { get; } = [];

        public Exception? FailWith { get; set; }

        /// <summary>Completes on the first sweep, whether it succeeds or throws.</summary>
        public TaskCompletionSource Swept { get; } = new();

        public Task<int> DropBeforeAsync(DateOnly oldestKept, CancellationToken cancellationToken)
        {
            try
            {
                if (this.FailWith is { } failure)
                {
                    throw failure;
                }

                this.Asked.Add(oldestKept);

                return Task.FromResult(0);
            }
            finally
            {
                this.Swept.TrySetResult();
            }
        }
    }
}
