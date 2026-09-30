namespace Analytics.Tests.Infrastructure.Buffering;

using Analytics.Infrastructure.Buffering;
using Analytics.Infrastructure.Configuration;
using Analytics.Tests.Fakes;
using Common.Diagnostics.Models;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

public sealed class ViewFlushServiceTests
{
    // Stopping must not strand counted views: the service flushes after its token is cancelled.
    [Fact]
    public async Task FlushesWhatIsBufferedWhenItStops()
    {
        FakeViewAccumulator durable = new();
        ViewBuffer buffer = Buffer();
        buffer.Add("RO");
        buffer.Add("RO");
        buffer.Add("SE");

        ViewFlushService service = Build(durable, buffer);
        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        IReadOnlyDictionary<string, long> written = Assert.Single(durable.Batches);
        Assert.Equal(2, written["RO"]);
        Assert.Equal(1, written["SE"]);
        Assert.Empty(buffer.Snapshot());
    }

    [Fact]
    public async Task WritesNothingWhenNoViewsWereCounted()
    {
        FakeViewAccumulator durable = new();

        ViewFlushService service = Build(durable, Buffer());
        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Empty(durable.Batches);
    }

    // A storage failure must leave the counts buffered rather than swallow them.
    [Fact]
    public async Task KeepsTheViewsWhenTheWriteFails()
    {
        FakeViewAccumulator durable = new() { FailWith = new InvalidOperationException("storage is down") };
        ViewBuffer buffer = Buffer();
        buffer.Add("RO");

        ViewFlushService service = Build(durable, buffer);
        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Empty(durable.Batches);
        Assert.Equal(1, buffer.Snapshot()["RO"]);
    }

    // Without this the readiness check reports on a worker that never says anything, which is
    // indistinguishable from one that never started.
    [Fact]
    public async Task ReportsThatItIsRunningAsSoonAsItStarts()
    {
        FakeHeartbeatLog heartbeats = new();

        ViewFlushService service = Build(new FakeViewAccumulator(), Buffer(), heartbeats);
        await service.StartAsync(CancellationToken.None);
        Heartbeat beat = await heartbeats.FirstBeat.WaitAsync(TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(ViewFlushService.Worker, beat.Worker);
        Assert.Equal(TimeSpan.FromMilliseconds(100), beat.Period);
    }

    private static ViewBuffer Buffer()
    {
        return new ViewBuffer(new PendingViews(), new ViewNudges(8), new ViewFlushGate());
    }

    private static ViewFlushService Build(
        FakeViewAccumulator durable, IViewBuffer buffer, FakeHeartbeatLog? heartbeats = null)
    {
        CounterOptions options = new()
        {
            AzureWebJobsStorage = "UseDevelopmentStorage=true",
            FlushInterval = TimeSpan.FromMilliseconds(100),
        };

        return new ViewFlushService(
            durable,
            buffer,
            Options.Create(options),
            heartbeats ?? new FakeHeartbeatLog(),
            NullLogger<ViewFlushService>.Instance);
    }
}
