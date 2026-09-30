namespace Analytics.Tests.Infrastructure.Buffering;

using Analytics.Infrastructure.Buffering;
using Xunit;

/// <summary>What is worth testing here is the sequence a caller used to have to get right.</summary>
public sealed class ViewBufferTests
{
    // Counting a view without waking the flusher is the mistake the contract exists to make
    // impossible. It is silent, and it costs a flush interval per view.
    [Fact]
    public async Task WakesTheFlusherWhenAViewIsCounted()
    {
        ViewBuffer buffer = Buffer();

        buffer.Add("RO");

        using CancellationTokenSource giveUp = new(TimeSpan.FromSeconds(5));
        await buffer.WaitForViewsAsync(giveUp.Token);

        Assert.Equal(1, buffer.Snapshot()["RO"]);
    }

    [Fact]
    public async Task LeavesTheFlusherWaitingWhenNothingWasCounted()
    {
        ViewBuffer buffer = Buffer();

        using CancellationTokenSource giveUp = new(TimeSpan.FromMilliseconds(100));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => buffer.WaitForViewsAsync(giveUp.Token));
    }

    // Taking hands the increments to the caller, so failing to write them must hand them back.
    [Fact]
    public void GivesBackWhatAFailedWriteCouldNotStore()
    {
        ViewBuffer buffer = Buffer();
        buffer.Add("RO");

        IReadOnlyDictionary<string, long> taken = buffer.Take();
        Assert.Empty(buffer.Snapshot());

        buffer.Restore(taken);

        Assert.Equal(1, buffer.Snapshot()["RO"]);
    }

    // One side at a time, which is what keeps a flush from being half visible to a read.
    [Fact]
    public async Task LetsOnlyOneSideHoldItAtATime()
    {
        ViewBuffer buffer = Buffer();

        // Not a using declaration: this one is released in the middle of the test, and disposing
        // a hold twice releases the semaphore twice.
        IDisposable held = await buffer.HoldAsync(CancellationToken.None);

        Task<IDisposable> second = buffer.HoldAsync(CancellationToken.None);
        await Task.Delay(TimeSpan.FromMilliseconds(50));

        Assert.False(second.IsCompleted);

        held.Dispose();

        (await second).Dispose();
    }

    private static ViewBuffer Buffer()
    {
        return new ViewBuffer(new PendingViews(), new ViewNudges(8), new ViewFlushGate());
    }
}
