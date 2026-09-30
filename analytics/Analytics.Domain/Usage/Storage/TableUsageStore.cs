namespace Analytics.Domain.Usage.Storage;

using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Storage;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;

/// <summary>A day of usage as counter rows: one per operation, one for views, one for refusals.</summary>
/// <remarks>What is stored is a count and nothing else, in a partition of its own.</remarks>
public sealed class TableUsageStore(
    ICounterTable table,
    ICounterIncrementer counters,
    IInteractionCatalogue catalogue) : IUsageStore
{
    public async Task ApplyAsync(
        DateOnly day, AnalyticsSummary counted, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(counted);

        string partition = UsageRowKey.PartitionFor(day);

        foreach (OperationCount operation in counted.Operations)
        {
            await counters.IncrementAsync(
                partition, UsageRowKey.ForOperation(operation.Kind), operation.Count, cancellationToken);
        }

        if (counted.Views > 0)
        {
            await counters.IncrementAsync(partition, UsageRowKey.Views, counted.Views, cancellationToken);
        }

        if (counted.Rejected > 0)
        {
            await counters.IncrementAsync(partition, UsageRowKey.Rejected, counted.Rejected, cancellationToken);
        }
    }

    public async Task<AnalyticsSummary> ReadAsync(DateOnly day, CancellationToken cancellationToken)
    {
        IReadOnlyList<(string RowKey, long Value)> rows =
            await table.ListAsync(UsageRowKey.PartitionFor(day), cancellationToken);

        int views = 0;
        int rejected = 0;
        List<OperationCount> operations = [];

        foreach ((string rowKey, long value) in rows)
        {
            if (rowKey == UsageRowKey.Views)
            {
                views = Clamp(value);
            }
            else if (rowKey == UsageRowKey.Rejected)
            {
                rejected = Clamp(value);
            }
            else if (UsageRowKey.IsOperation(rowKey)
                && catalogue.Resolve(UsageRowKey.OperationOf(rowKey)) is { } kind)
            {
                // A row whose kind the catalogue no longer knows is left out rather than guessed
                // at: without a kind there is nothing to call it in the email. The row stays,
                // so putting the kind back brings its history back with it.
                operations.Add(new OperationCount(kind, Clamp(value)));
            }
        }

        return views == 0 && rejected == 0 && operations.Count == 0
            ? AnalyticsSummary.Empty
            : AnalyticsSummary.Of(views, operations, rejected);
    }

    /// <summary>Stored as a long and reported as an int, capped rather than wrapped.</summary>
    private static int Clamp(long value)
    {
        return value > int.MaxValue ? int.MaxValue : (int)value;
    }
}
