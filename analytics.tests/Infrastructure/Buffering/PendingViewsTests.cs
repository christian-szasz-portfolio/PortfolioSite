namespace Analytics.Tests.Infrastructure.Buffering;

using Analytics.Infrastructure.Buffering;
using Xunit;

public sealed class PendingViewsTests
{
    [Fact]
    public void AggregatesRepeatedViewsPerCountry()
    {
        PendingViews pending = new();

        pending.Add("RO");
        pending.Add("RO");
        pending.Add("SE");

        IReadOnlyDictionary<string, long> snapshot = pending.Snapshot();
        Assert.Equal(2, snapshot["RO"]);
        Assert.Equal(1, snapshot["SE"]);
    }

    [Fact]
    public void TakeHandsOverTheCountsAndLeavesTheBufferEmpty()
    {
        PendingViews pending = new();
        pending.Add("RO");

        IReadOnlyDictionary<string, long> first = pending.Take();
        IReadOnlyDictionary<string, long> second = pending.Take();

        Assert.Equal(1, first["RO"]);
        Assert.Empty(second);
        Assert.Empty(pending.Snapshot());
    }

    [Fact]
    public void RestorePutsAFailedBatchBack()
    {
        PendingViews pending = new();
        pending.Add("RO");
        IReadOnlyDictionary<string, long> taken = pending.Take();

        pending.Add("RO");
        pending.Restore(taken);

        Assert.Equal(2, pending.Snapshot()["RO"]);
    }

    // The whole point of Interlocked here: concurrent requests must not lose an increment.
    [Fact]
    public async Task LosesNothingUnderConcurrentAdds()
    {
        PendingViews pending = new();
        const int Writers = 16;
        const int PerWriter = 5000;

        await Task.WhenAll(Enumerable.Range(0, Writers).Select(_ => Task.Run(() =>
        {
            for (int i = 0; i < PerWriter; i++)
            {
                pending.Add("RO");
            }
        })));

        Assert.Equal(Writers * PerWriter, pending.Snapshot()["RO"]);
    }

    // A flush running while requests arrive must not drop the views it did not take.
    [Fact]
    public async Task CountsNothingTwiceWhenTakeRunsBesideAdds()
    {
        PendingViews pending = new();
        const int Total = 40000;
        long drained = 0;

        Task adding = Task.Run(() =>
        {
            for (int i = 0; i < Total; i++)
            {
                pending.Add("RO");
            }
        });

        while (!adding.IsCompleted)
        {
            drained += pending.Take().GetValueOrDefault("RO");
        }

        await adding;
        drained += pending.Take().GetValueOrDefault("RO");

        Assert.Equal(Total, drained);
    }
}
