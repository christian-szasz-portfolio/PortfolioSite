namespace Analytics.Domain.Views;

using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;
using Analytics.Domain.Storage;

/// <summary>The view counter: a total row and one row per country, in a single partition.</summary>
public sealed class TableViewStore(ICounterTable table, ICounterIncrementer counters)
    : IViewStore, IViewAccumulator
{
    public async Task<ViewStats> RecordAsync(string country, CancellationToken cancellationToken)
    {
        await this.ApplyAsync(
            new Dictionary<string, long>(StringComparer.Ordinal) { [country] = 1 },
            cancellationToken);

        return await this.ReadAsync(cancellationToken);
    }

    /// <summary>One write per country plus one for the total, however large the batch.</summary>
    public async Task ApplyAsync(IReadOnlyDictionary<string, long> deltas, CancellationToken cancellationToken)
    {
        long total = 0;

        foreach (KeyValuePair<string, long> delta in deltas)
        {
            if (delta.Value == 0)
            {
                continue;
            }

            await counters.IncrementAsync(
                CounterRowKey.Partition, CounterRowKey.ForCountry(delta.Key), delta.Value, cancellationToken);
            total += delta.Value;
        }

        if (total != 0)
        {
            await counters.IncrementAsync(
                CounterRowKey.Partition, CounterRowKey.Total, total, cancellationToken);
        }
    }

    public async Task<ViewStats> ReadAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<(string RowKey, long Value)> rows =
            await table.ListAsync(CounterRowKey.Partition, cancellationToken);

        long total = 0;
        List<CountryCount> countries = [];
        foreach ((string rowKey, long value) in rows)
        {
            if (rowKey == CounterRowKey.Total)
            {
                total = value;
            }
            else if (CounterRowKey.IsCountry(rowKey))
            {
                countries.Add(new CountryCount(CounterRowKey.CountryOf(rowKey), value));
            }
        }

        countries.Sort((left, right) => right.Count.CompareTo(left.Count));
        return new ViewStats(total, countries);
    }
}
