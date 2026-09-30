namespace Analytics.Tests.Infrastructure.Buffering;

using Analytics.Domain.Models;
using Analytics.Infrastructure.Buffering;
using Analytics.Infrastructure.Configuration;
using Analytics.Tests.Fakes;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

public sealed class BufferedViewStoreTests
{
    // A visitor must see their own view immediately, even though nothing has been written yet.
    [Fact]
    public async Task CountsAViewThatHasNotBeenFlushedYet()
    {
        FakeViewAccumulator durable = new();

        ViewStats stats = await Build(durable, Buffer()).RecordAsync("ro", CancellationToken.None);

        Assert.Equal(1, stats.Total);
        Assert.Equal("RO", Assert.Single(stats.Countries).Code);
        Assert.Empty(durable.Batches);
    }

    [Fact]
    public async Task AddsBufferedCountsToStoredOnes()
    {
        FakeViewAccumulator durable = new();
        await durable.ApplyAsync(
            new Dictionary<string, long>(StringComparer.Ordinal) { ["RO"] = 5, ["SE"] = 2 },
            CancellationToken.None);

        BufferedViewStore store = Build(durable, Buffer());
        await store.RecordAsync("RO", CancellationToken.None);
        ViewStats stats = await store.ReadAsync(CancellationToken.None);

        Assert.Equal(8, stats.Total);
        Assert.Equal(6, stats.Countries.Single(country => country.Code == "RO").Count);
        Assert.Equal(2, stats.Countries.Single(country => country.Code == "SE").Count);
    }

    [Fact]
    public async Task NormalisesTheCountryBeforeBuffering()
    {
        ViewBuffer buffer = Buffer();

        await Build(new FakeViewAccumulator(), buffer).RecordAsync("not-a-code", CancellationToken.None);

        Assert.Equal(1, buffer.Snapshot()["ZZ"]);
    }

    // The race this closes. RecordAsync buffers the view, then asks storage for the stored
    // total; a flush landing while that read is in flight takes the view out of the buffer
    // before the answer is assembled, leaving it in neither place. Seen against a running host
    // as a POST whose response did not include the view it had just recorded: 1 of 10.
    [Fact]
    public async Task IncludesTheViewItRecordedWhenAFlushRunsDuringTheRead()
    {
        FakeViewAccumulator durable = new();
        ViewBuffer buffer = Buffer();

        // The storage read answers from before the flush's write, which is what makes the two
        // halves of the answer disagree with each other.
        durable.PauseNextRead();

        Task<ViewStats> recording = new BufferedViewStore(durable, buffer)
            .RecordAsync("RO", CancellationToken.None);
        await durable.ReadStarted.Task;

        // A flush, at exactly the moment that used to lose the view.
        Task flushing = FlushAsync(durable, buffer);
        await Task.Delay(TimeSpan.FromMilliseconds(50));

        // It has to wait its turn. Without that it writes here, and the read that follows finds
        // the view gone from the buffer and not yet in the total it already took from storage.
        Assert.Empty(durable.Batches);
        Assert.False(flushing.IsCompleted);

        durable.ReleaseRead();
        ViewStats stats = await recording;
        await flushing;

        Assert.Equal(1, stats.Total);
        Assert.Equal(1, stats.Countries.Single(country => country.Code == "RO").Count);
        Assert.Single(durable.Batches);
    }

    private static ViewBuffer Buffer()
    {
        return new ViewBuffer(new PendingViews(), new ViewNudges(8), new ViewFlushGate());
    }

    private static BufferedViewStore Build(FakeViewAccumulator durable, IViewBuffer buffer)
    {
        return new BufferedViewStore(durable, buffer);
    }

    /// <summary>One flush, driven through the real service so the test does not reimplement it.</summary>
    private static async Task FlushAsync(FakeViewAccumulator durable, IViewBuffer buffer)
    {
        CounterOptions options = new() { AzureWebJobsStorage = "UseDevelopmentStorage=true" };

        ViewFlushService service = new(
            durable,
            buffer,
            Options.Create(options),
            new FakeHeartbeatLog(),
            NullLogger<ViewFlushService>.Instance);

        // Stopping flushes, and a service that was never started has nothing else to do first.
        await service.StopAsync(CancellationToken.None);
    }
}
