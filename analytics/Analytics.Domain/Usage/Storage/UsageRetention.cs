namespace Analytics.Domain.Usage.Storage;

using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Usage.Abstractions;

/// <summary>Keeps the stored days to a window and drops the rest.</summary>
/// <remarks>It works on partition names alone, and leaves a name it cannot parse alone.</remarks>
public sealed class UsageRetention(ICounterTable table) : IUsageRetention
{
    public async Task<int> DropBeforeAsync(DateOnly oldestKept, CancellationToken cancellationToken)
    {
        IReadOnlyList<string> partitions =
            await table.ListPartitionsAsync(UsageRowKey.PartitionPrefix, cancellationToken);

        int dropped = 0;

        foreach (string partition in partitions)
        {
            if (!UsageRowKey.TryDayOf(partition, out DateOnly day) || day >= oldestKept)
            {
                continue;
            }

            await table.DeletePartitionAsync(partition, cancellationToken);
            dropped++;
        }

        return dropped;
    }
}
