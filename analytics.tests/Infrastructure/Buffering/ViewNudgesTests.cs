namespace Analytics.Tests.Infrastructure.Buffering;

using Analytics.Infrastructure.Buffering;
using Xunit;

public sealed class ViewNudgesTests
{
    [Fact]
    public async Task WaitReturnsOnceAViewHasBeenCounted()
    {
        ViewNudges nudges = new(8);
        nudges.Notify();

        await nudges.WaitAsync(CancellationToken.None);
    }

    // A burst should cost one flush, not one per view, so the wait clears what queued behind it.
    [Fact]
    public async Task ClearsTheWholeBurstSoTheNextWaitBlocks()
    {
        ViewNudges nudges = new(8);
        nudges.Notify();
        nudges.Notify();
        nudges.Notify();

        await nudges.WaitAsync(CancellationToken.None);

        using CancellationTokenSource timeout = new(TimeSpan.FromMilliseconds(150));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => nudges.WaitAsync(timeout.Token));
    }

    // Dropping a nudge is safe by design, so a full queue must never throw or block.
    [Fact]
    public void NotifyingMoreThanTheQueueHoldsIsHarmless()
    {
        ViewNudges nudges = new(2);

        for (int i = 0; i < 100; i++)
        {
            nudges.Notify();
        }
    }

    [Fact]
    public async Task WaitStopsWhenCancelled()
    {
        using CancellationTokenSource cancelled = new();
        await cancelled.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new ViewNudges(8).WaitAsync(cancelled.Token));
    }
}
