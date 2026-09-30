namespace Analytics.Infrastructure.Buffering;

/// <summary>Views counted but not yet stored, and the signal that some are waiting.</summary>
/// <remarks>The tallies, the nudge and the gate under one name, because they only travel together.</remarks>
public interface IViewBuffer
{
    /// <summary>Counts one view for an already normalised country code and wakes the flusher.</summary>
    /// <remarks>One call rather than two, so counting without waking cannot happen.</remarks>
    void Add(string country);

    /// <summary>Waits for the buffer's turn and returns the hold; dispose it to let the other side proceed.</summary>
    Task<IDisposable> HoldAsync(CancellationToken cancellationToken);

    /// <summary>Waits until a view has been counted, clearing any that queued behind it.</summary>
    Task WaitForViewsAsync(CancellationToken cancellationToken);

    /// <summary>Takes everything counted so far; the caller must hand back what it cannot write.</summary>
    IReadOnlyDictionary<string, long> Take();

    /// <summary>Puts taken increments back after a failed write, so nothing is dropped.</summary>
    void Restore(IReadOnlyDictionary<string, long> taken);

    /// <summary>What is currently buffered, for adding to the stored totals.</summary>
    IReadOnlyDictionary<string, long> Snapshot();
}
