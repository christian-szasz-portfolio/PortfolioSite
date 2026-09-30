namespace Analytics.Infrastructure.Tables;

using Analytics.Domain.Abstractions.Storage;
using Azure;
using Azure.Data.Tables;

/// <summary>Azure Table Storage backing for <see cref="ICounterTable"/>. One row per counter.</summary>
public sealed class AzureCounterTable(TableClient client) : ICounterTable
{
    public async Task<CounterRow?> TryGetAsync(
        string partition, string rowKey, CancellationToken cancellationToken)
    {
        NullableResponse<CounterEntity> response =
            await client.GetEntityIfExistsAsync<CounterEntity>(partition, rowKey, cancellationToken: cancellationToken);

        if (!response.HasValue || response.Value is null)
        {
            return null;
        }

        return new CounterRow(response.Value.Value, response.Value.ETag.ToString());
    }

    /// <summary>One method for both shapes of write, each reporting its own conflict as a lost race.</summary>
    public async Task WriteAsync(CounterWrite write, CancellationToken cancellationToken)
    {
        CounterEntity entity =
            new() { PartitionKey = write.Partition, RowKey = write.RowKey, Value = write.Value };

        try
        {
            if (write.CreatesRow)
            {
                await client.AddEntityAsync(entity, cancellationToken);
            }
            else
            {
                await client.UpdateEntityAsync(
                    entity, new ETag(write.ETag!), TableUpdateMode.Replace, cancellationToken);
            }
        }
        catch (RequestFailedException ex) when (ex.Status is 409 or 412)
        {
            throw new ConcurrencyException(
                write.CreatesRow
                    ? $"Row '{write.RowKey}' was created by another writer."
                    : $"Row '{write.RowKey}' changed under us.");
        }
    }

    public async Task<IReadOnlyList<(string RowKey, long Value)>> ListAsync(
        string partition, CancellationToken cancellationToken)
    {
        List<(string RowKey, long Value)> rows = [];
        AsyncPageable<CounterEntity> query =
            client.QueryAsync<CounterEntity>(entity => entity.PartitionKey == partition, cancellationToken: cancellationToken);

        await foreach (CounterEntity entity in query)
        {
            rows.Add((entity.RowKey, entity.Value));
        }

        return rows;
    }

    /// <summary>The rows in the prefix range, reduced to their partitions, keys only.</summary>
    public async Task<IReadOnlyList<string>> ListPartitionsAsync(
        string prefix, CancellationToken cancellationToken)
    {
        // A half-open range over the prefix. '~' is above every character a partition name of
        // ours can contain, so the upper bound ends the range without naming a last day.
        string filter = TableClient.CreateQueryFilter(
            $"PartitionKey ge {prefix} and PartitionKey lt {prefix + "~"}");

        SortedSet<string> partitions = new(StringComparer.Ordinal);
        AsyncPageable<CounterEntity> query = client.QueryAsync<CounterEntity>(
            filter, select: ["PartitionKey"], cancellationToken: cancellationToken);

        await foreach (CounterEntity entity in query)
        {
            partitions.Add(entity.PartitionKey);
        }

        return [.. partitions];
    }

    public async Task DeletePartitionAsync(string partition, CancellationToken cancellationToken)
    {
        AsyncPageable<CounterEntity> query = client.QueryAsync<CounterEntity>(
            entity => entity.PartitionKey == partition,
            select: ["PartitionKey", "RowKey"],
            cancellationToken: cancellationToken);

        await foreach (CounterEntity entity in query)
        {
            // ETag.All: whatever the row says now, it is going. A concurrent write to a day this
            // old would be a bug of its own, and failing the delete over it would only leave the
            // data that was meant to be gone.
            await client.DeleteEntityAsync(
                partition, entity.RowKey, ETag.All, cancellationToken);
        }
    }

    /// <summary>One counter row. <c>Value</c> is the running tally.</summary>
    public sealed class CounterEntity : ITableEntity
    {
        public string PartitionKey { get; set; } = string.Empty;

        public string RowKey { get; set; } = string.Empty;

        public long Value { get; set; }

        public DateTimeOffset? Timestamp { get; set; }

        public ETag ETag { get; set; }
    }
}
