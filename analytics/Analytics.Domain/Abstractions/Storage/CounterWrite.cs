namespace Analytics.Domain.Abstractions.Storage;

/// <summary>What one counter write is asking for, built through the named factories.</summary>
public sealed class CounterWrite
{
    private CounterWrite(string partition, string rowKey, long value, string? etag)
    {
        this.Partition = partition;
        this.RowKey = rowKey;
        this.Value = value;
        this.ETag = etag;
    }

    /// <summary>Which partition the row lives in.</summary>
    public string Partition { get; }

    /// <summary>The row being written.</summary>
    public string RowKey { get; }

    /// <summary>The value the row should hold afterwards.</summary>
    public long Value { get; }

    /// <summary>The ETag the update is guarded by, or <c>null</c> when this creates the row.</summary>
    public string? ETag { get; }

    /// <summary>True when the row is expected not to exist yet.</summary>
    public bool CreatesRow => this.ETag is null;

    /// <summary>Creates a row that is not there yet. Loses the race if another writer got there first.</summary>
    public static CounterWrite Insert(string partition, string rowKey, long value)
    {
        return new CounterWrite(partition, rowKey, value, null);
    }

    /// <summary>Replaces a row, but only while it still carries the ETag it was read at.</summary>
    public static CounterWrite Update(string partition, string rowKey, long value, string etag)
    {
        return new CounterWrite(partition, rowKey, value, etag);
    }
}
