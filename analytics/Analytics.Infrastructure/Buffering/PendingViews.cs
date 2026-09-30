namespace Analytics.Infrastructure.Buffering;

using System.Collections.Concurrent;
using System.Runtime.CompilerServices;

/// <summary>Views counted in memory but not yet stored, one interlocked counter per country.</summary>
public sealed class PendingViews
{
    private readonly ConcurrentDictionary<string, StrongBox<long>> counts = new(StringComparer.Ordinal);

    /// <summary>Counts one view for a country that has already been normalised.</summary>
    public void Add(string country)
    {
        StrongBox<long> counter = this.counts.GetOrAdd(country, _ => new StrongBox<long>(0));
        Interlocked.Increment(ref counter.Value);
    }

    /// <summary>Takes everything counted so far; the caller must hand back what it cannot write.</summary>
    public IReadOnlyDictionary<string, long> Take()
    {
        Dictionary<string, long> taken = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, StrongBox<long>> entry in this.counts)
        {
            long value = Interlocked.Exchange(ref entry.Value.Value, 0);
            if (value != 0)
            {
                taken[entry.Key] = value;
            }
        }

        return taken;
    }

    /// <summary>Puts taken increments back after a failed write, so nothing is dropped.</summary>
    public void Restore(IReadOnlyDictionary<string, long> taken)
    {
        foreach (KeyValuePair<string, long> entry in taken)
        {
            StrongBox<long> counter = this.counts.GetOrAdd(entry.Key, _ => new StrongBox<long>(0));
            Interlocked.Add(ref counter.Value, entry.Value);
        }
    }

    /// <summary>What is currently buffered, for adding to the stored totals.</summary>
    public IReadOnlyDictionary<string, long> Snapshot()
    {
        Dictionary<string, long> snapshot = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, StrongBox<long>> entry in this.counts)
        {
            long value = Interlocked.Read(ref entry.Value.Value);
            if (value != 0)
            {
                snapshot[entry.Key] = value;
            }
        }

        return snapshot;
    }
}
