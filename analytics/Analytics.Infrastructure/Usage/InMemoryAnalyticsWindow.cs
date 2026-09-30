namespace Analytics.Infrastructure.Usage;

using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;

/// <summary>Counts views and interactions in memory until the digest takes them.</summary>
/// <remarks>A buffer rather than the record, bounded by the catalogue and moved atomically.</remarks>
public sealed class InMemoryAnalyticsWindow : IAnalyticsRecorder, IAnalyticsWindow
{
    private readonly ConcurrentDictionary<InteractionKind, StrongBox<int>> counts = new();

    private int views;
    private int rejected;

    public void RecordView()
    {
        Interlocked.Increment(ref this.views);
    }

    public void RecordInteraction(Interaction interaction)
    {
        if (interaction is null)
        {
            return;
        }

        StrongBox<int> counter = this.counts.GetOrAdd(interaction.Kind, _ => new StrongBox<int>(0));
        Interlocked.Increment(ref counter.Value);
    }

    public void RecordRejection()
    {
        Interlocked.Increment(ref this.rejected);
    }

    public void Restore(AnalyticsSummary taken)
    {
        ArgumentNullException.ThrowIfNull(taken);

        Interlocked.Add(ref this.views, taken.Views);
        Interlocked.Add(ref this.rejected, taken.Rejected);

        foreach (OperationCount operation in taken.Operations)
        {
            StrongBox<int> counter = this.counts.GetOrAdd(operation.Kind, _ => new StrongBox<int>(0));
            Interlocked.Add(ref counter.Value, operation.Count);
        }
    }

    public AnalyticsSummary Take()
    {
        int takenViews = Interlocked.Exchange(ref this.views, 0);
        int takenRejected = Interlocked.Exchange(ref this.rejected, 0);

        List<OperationCount> operations = [];
        foreach (KeyValuePair<InteractionKind, StrongBox<int>> entry in this.counts)
        {
            int count = Interlocked.Exchange(ref entry.Value.Value, 0);
            if (count > 0)
            {
                operations.Add(new OperationCount(entry.Key, count));
            }
        }

        // The counters stay in the dictionary at zero rather than being removed: there is one per
        // catalogued kind at the most, and removing them would race with a request incrementing
        // one, which is how a counted interaction goes missing.
        return takenViews == 0 && takenRejected == 0 && operations.Count == 0
            ? AnalyticsSummary.Empty
            : AnalyticsSummary.Of(takenViews, operations, takenRejected);
    }
}
