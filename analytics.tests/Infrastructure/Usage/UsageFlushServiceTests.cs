namespace Analytics.Tests.Infrastructure.Usage;

using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Infrastructure.Configuration;
using Analytics.Infrastructure.Usage;
using Analytics.Tests.Fakes;
using Common.Diagnostics.Models;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Xunit;

public sealed class UsageFlushServiceTests
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 6, 12, 0, 0, TimeSpan.Zero);

    private readonly InMemoryAnalyticsWindow window = new();
    private readonly FakeUsageStore store = new();
    private readonly FakeTimeProvider time = new(Noon);
    private readonly FakeHeartbeatLog heartbeats = new();

    // Stopping must not strand what was counted: the service flushes after its token is cancelled.
    [Fact]
    public async Task StoresWhatIsCountedWhenItStops()
    {
        this.window.RecordView();
        this.window.RecordInteraction(Interaction.Of(InteractionCatalogue.CvPdf, null, Noon));

        UsageFlushService service = this.Build();
        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        (DateOnly day, AnalyticsSummary counted) = Assert.Single(this.store.Applied);

        Assert.Equal(new DateOnly(2026, 9, 6), day);
        Assert.Equal(1, counted.Views);
        Assert.Equal(1, counted.Interactions);
    }

    [Fact]
    public async Task WritesNothingWhenNobodyDidAnything()
    {
        UsageFlushService service = this.Build();
        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Empty(this.store.Applied);
    }

    // A storage failure must leave the counts in memory rather than swallow them: the next flush
    // carries them, and the day they land on is the only thing that is lost.
    [Fact]
    public async Task HandsTheCountsBackWhenTheWriteFails()
    {
        this.window.RecordView();
        this.store.FailWith = new InvalidOperationException("storage is down");

        UsageFlushService service = this.Build();
        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Empty(this.store.Applied);
        Assert.Equal(1, this.window.Take().Views);
    }

    // The window empties into the store, so a second flush must not report the first one again.
    [Fact]
    public async Task StoresEachCountOnce()
    {
        this.window.RecordView();

        UsageFlushService first = this.Build();
        await first.StartAsync(CancellationToken.None);
        await first.StopAsync(CancellationToken.None);

        UsageFlushService second = this.Build();
        await second.StartAsync(CancellationToken.None);
        await second.StopAsync(CancellationToken.None);

        Assert.Single(this.store.Applied);
    }

    // Without this the readiness check reports on a worker that never says anything, which is
    // indistinguishable from one that never started.
    [Fact]
    public async Task ReportsThatItIsRunningAsSoonAsItStarts()
    {
        UsageFlushService service = this.Build();
        await service.StartAsync(CancellationToken.None);
        Heartbeat beat = await this.heartbeats.FirstBeat.WaitAsync(TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(UsageFlushService.Worker, beat.Worker);
        Assert.Equal(TimeSpan.FromMinutes(5), beat.Period);
    }

    private UsageFlushService Build()
    {
        CounterOptions options = new()
        {
            AzureWebJobsStorage = "UseDevelopmentStorage=true",
            FlushInterval = TimeSpan.FromMinutes(5),
        };

        return new UsageFlushService(
            this.window,
            this.store,
            Options.Create(options),
            this.time,
            this.heartbeats,
            NullLogger<UsageFlushService>.Instance);
    }
}
