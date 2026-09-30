namespace Analytics.Domain.Storage;

using Analytics.Domain.Abstractions.Resilience;
using Analytics.Domain.Abstractions.Storage;

/// <summary>Adds to a stored counter under optimistic concurrency.</summary>
/// <remarks>Table Storage has no server-side increment, so a lost race re-reads and adds again.</remarks>
public sealed class CounterIncrementer(ICounterTable table, IRetryPolicy retry) : ICounterIncrementer
{
    public Task IncrementAsync(
        string partition, string rowKey, long amount, CancellationToken cancellationToken)
    {
        return retry.ExecuteAsync(
            async token =>
            {
                CounterRow? current = await table.TryGetAsync(partition, rowKey, token);

                CounterWrite write = current is null
                    ? CounterWrite.Insert(partition, rowKey, amount)
                    : CounterWrite.Update(
                        partition, rowKey, current.Value.Value + amount, current.Value.ETag);

                await table.WriteAsync(write, token);
            },
            $"incrementing '{rowKey}' in '{partition}'",
            cancellationToken);
    }
}
