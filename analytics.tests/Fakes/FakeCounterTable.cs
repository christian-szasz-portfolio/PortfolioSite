namespace Analytics.Tests.Fakes;

using Analytics.Domain.Abstractions.Storage;

/// <summary>In-memory <see cref="ICounterTable"/> that can inject lost races on the next writes.</summary>
public sealed class FakeCounterTable : ICounterTable
{
    private readonly Dictionary<(string Partition, string RowKey), (long Value, int ETag)> rows = [];

    private readonly List<(string Partition, string RowKey)> reads = [];

    /// <summary>How many of the next writes should fail with a race before one succeeds.</summary>
    public int FailuresToInject { get; set; }

    /// <summary>Thrown by every read, for the callers that have to cope with an unreachable table.</summary>
    public Exception? ReadFailure { get; set; }

    /// <summary>Every point read, in order, so a test can say what a caller actually asked for.</summary>
    public IReadOnlyList<(string Partition, string RowKey)> Reads => this.reads;

    /// <summary>How many times a caller listed a partition rather than reading one row.</summary>
    public int Listings { get; private set; }

    /// <summary>Seeds a row directly, bypassing the failure injection.</summary>
    public void Seed(string partition, string rowKey, long value)
    {
        this.rows[(partition, rowKey)] = (value, 1);
    }

    public Task<CounterRow?> TryGetAsync(
        string partition, string rowKey, CancellationToken cancellationToken)
    {
        this.reads.Add((partition, rowKey));

        if (this.ReadFailure is not null)
        {
            throw this.ReadFailure;
        }

        if (this.rows.TryGetValue((partition, rowKey), out (long Value, int ETag) row))
        {
            return Task.FromResult<CounterRow?>(new CounterRow(row.Value, row.ETag.ToString()));
        }

        return Task.FromResult<CounterRow?>(null);
    }

    public Task WriteAsync(CounterWrite write, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(write);

        if (this.TripFailure())
        {
            throw new ConcurrencyException($"Injected race writing '{write.RowKey}'.");
        }

        (string Partition, string RowKey) key = (write.Partition, write.RowKey);

        if (write.CreatesRow)
        {
            if (this.rows.ContainsKey(key))
            {
                throw new ConcurrencyException($"Row '{write.RowKey}' already exists.");
            }

            this.rows[key] = (write.Value, 1);
            return Task.CompletedTask;
        }

        if (!this.rows.TryGetValue(key, out (long Value, int ETag) row)
            || row.ETag.ToString() != write.ETag)
        {
            throw new ConcurrencyException($"Row '{write.RowKey}' changed under us.");
        }

        this.rows[key] = (write.Value, row.ETag + 1);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<(string RowKey, long Value)>> ListAsync(
        string partition, CancellationToken cancellationToken)
    {
        this.Listings++;

        // Only this partition, as the real table does. A fake that answered with everything would
        // hide the whole reason usage is kept a day at a time.
        IReadOnlyList<(string, long)> snapshot =
        [
            .. this.rows
                .Where(pair => pair.Key.Partition == partition)
                .Select(pair => (pair.Key.RowKey, pair.Value.Value)),
        ];

        return Task.FromResult(snapshot);
    }

    public Task<IReadOnlyList<string>> ListPartitionsAsync(
        string prefix, CancellationToken cancellationToken)
    {
        IReadOnlyList<string> partitions =
        [
            .. this.rows.Keys
                .Select(key => key.Partition)
                .Where(partition => partition.StartsWith(prefix, StringComparison.Ordinal))
                .Distinct(StringComparer.Ordinal)
                .Order(StringComparer.Ordinal),
        ];

        return Task.FromResult(partitions);
    }

    public Task DeletePartitionAsync(string partition, CancellationToken cancellationToken)
    {
        foreach ((string Partition, string RowKey) key in
            this.rows.Keys.Where(key => key.Partition == partition).ToList())
        {
            this.rows.Remove(key);
        }

        return Task.CompletedTask;
    }

    private bool TripFailure()
    {
        if (this.FailuresToInject <= 0)
        {
            return false;
        }

        this.FailuresToInject--;
        return true;
    }
}
