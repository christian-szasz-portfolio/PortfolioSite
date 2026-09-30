namespace Analytics.Tests.Fakes;

using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Storage;

/// <summary>In-memory <see cref="ILogTable"/>, so a shared day needs no storage account.</summary>
public sealed class FakeLogTable : ILogTable
{
    private readonly Dictionary<string, List<LogRow>> partitions = new(StringComparer.Ordinal);

    public Task AppendAsync(
        string partition, IReadOnlyList<LogRow> rows, CancellationToken cancellationToken)
    {
        this.Rows(partition).AddRange(rows);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<LogRow>> ListAsync(
        string partition, CancellationToken cancellationToken)
    {
        IReadOnlyList<LogRow> rows =
            this.partitions.TryGetValue(partition, out List<LogRow>? stored) ? stored : [];

        return Task.FromResult(rows);
    }

    public Task<IReadOnlyList<string>> ListPartitionsAsync(
        string prefix, CancellationToken cancellationToken)
    {
        IReadOnlyList<string> names =
        [
            .. this.partitions.Keys
                .Where(name => name.StartsWith(prefix, StringComparison.Ordinal))
                .Order(StringComparer.Ordinal),
        ];

        return Task.FromResult(names);
    }

    public Task DeletePartitionAsync(string partition, CancellationToken cancellationToken)
    {
        this.partitions.Remove(partition);

        return Task.CompletedTask;
    }

    private List<LogRow> Rows(string partition)
    {
        if (!this.partitions.TryGetValue(partition, out List<LogRow>? rows))
        {
            rows = [];
            this.partitions[partition] = rows;
        }

        return rows;
    }
}
