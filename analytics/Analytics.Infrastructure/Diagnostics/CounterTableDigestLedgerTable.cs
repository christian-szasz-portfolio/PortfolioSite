namespace Analytics.Infrastructure.Diagnostics;

using Analytics.Domain.Abstractions.Storage;
using Common.Diagnostics.Abstractions;

/// <summary>Adapts the counter table's insert-loses-race primitive to the shared digest ledger.</summary>
public sealed class CounterTableDigestLedgerTable(ICounterTable table) : IDigestLedgerTable
{
    public async Task InsertAsync(string partition, string row, CancellationToken cancellationToken)
    {
        try
        {
            await table.WriteAsync(CounterWrite.Insert(partition, row, 1), cancellationToken);
        }
        catch (ConcurrencyException)
        {
            throw new DigestLedgerConflictException();
        }
    }
}
