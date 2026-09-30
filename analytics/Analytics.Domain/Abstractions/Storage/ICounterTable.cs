namespace Analytics.Domain.Abstractions.Storage;

/// <summary>The narrow set of table operations the counters need.</summary>
/// <remarks>Every operation names its partition, so a read never scans the rows beside it.</remarks>
public interface ICounterTable
{
    /// <summary>Reads one row, or <c>null</c> when it does not exist yet.</summary>
    Task<CounterRow?> TryGetAsync(string partition, string rowKey, CancellationToken cancellationToken);

    /// <summary>Applies one write, throwing <see cref="ConcurrencyException"/> when it loses a race.</summary>
    Task WriteAsync(CounterWrite write, CancellationToken cancellationToken);

    /// <summary>Lists one partition's rows as (rowKey, value) pairs.</summary>
    Task<IReadOnlyList<(string RowKey, long Value)>> ListAsync(
        string partition, CancellationToken cancellationToken);

    /// <summary>The partitions whose names start with <paramref name="prefix"/>, in order.</summary>
    /// <remarks>Table Storage cannot list partitions, so this reduces the row keys in the range.</remarks>
    Task<IReadOnlyList<string>> ListPartitionsAsync(
        string prefix, CancellationToken cancellationToken);

    /// <summary>Removes every row in one partition. Silent when there are none.</summary>
    Task DeletePartitionAsync(string partition, CancellationToken cancellationToken);
}
