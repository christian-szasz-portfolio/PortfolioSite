namespace Analytics.Infrastructure.Buffering;

/// <summary>The write-behind buffer, assembled from its three parts.</summary>
/// <remarks>It adds nothing beyond doing the counting and the waking together.</remarks>
public sealed class ViewBuffer(
    PendingViews counts,
    ViewNudges nudges,
    ViewFlushGate gate) : IViewBuffer
{
    public void Add(string country)
    {
        counts.Add(country);
        nudges.Notify();
    }

    public Task<IDisposable> HoldAsync(CancellationToken cancellationToken)
    {
        return gate.HoldAsync(cancellationToken);
    }

    public Task WaitForViewsAsync(CancellationToken cancellationToken)
    {
        return nudges.WaitAsync(cancellationToken);
    }

    public IReadOnlyDictionary<string, long> Take()
    {
        return counts.Take();
    }

    public void Restore(IReadOnlyDictionary<string, long> taken)
    {
        counts.Restore(taken);
    }

    public IReadOnlyDictionary<string, long> Snapshot()
    {
        return counts.Snapshot();
    }
}
