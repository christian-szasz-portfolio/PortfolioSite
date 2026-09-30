namespace Analytics.Tests.Domain.Views;

using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Models;
using Analytics.Domain.Resilience;
using Analytics.Domain.Storage;
using Analytics.Domain.Views;
using Analytics.Tests.Fakes;
using Xunit;

/// <summary>Covers the batch path the flusher uses, and the point at which the store gives up.</summary>
public sealed class TableViewStoreBatchTests
{
    [Fact]
    public async Task WritesOneRowPerCountryPlusOneTotal()
    {
        FakeCounterTable table = new();
        TableViewStore store = new(table, Incrementer(table, 5));

        await store.ApplyAsync(
            new Dictionary<string, long>(StringComparer.Ordinal) { ["RO"] = 7, ["SE"] = 3 },
            CancellationToken.None);

        ViewStats stats = await store.ReadAsync(CancellationToken.None);
        Assert.Equal(10, stats.Total);
        Assert.Equal(7, stats.Countries.Single(country => country.Code == "RO").Count);
        Assert.Equal(3, stats.Countries.Single(country => country.Code == "SE").Count);
    }

    [Fact]
    public async Task NormalisesCountriesAndFoldsUnknownOnesTogether()
    {
        FakeCounterTable table = new();
        TableViewStore store = new(table, Incrementer(table, 5));

        await store.ApplyAsync(
            new Dictionary<string, long>(StringComparer.Ordinal) { ["ro"] = 2, ["nonsense"] = 4 },
            CancellationToken.None);

        ViewStats stats = await store.ReadAsync(CancellationToken.None);
        Assert.Equal(2, stats.Countries.Single(country => country.Code == "RO").Count);
        Assert.Equal(4, stats.Countries.Single(country => country.Code == "ZZ").Count);
    }

    [Fact]
    public async Task IgnoresAZeroDelta()
    {
        FakeCounterTable table = new();
        TableViewStore store = new(table, Incrementer(table, 5));

        await store.ApplyAsync(
            new Dictionary<string, long>(StringComparer.Ordinal) { ["RO"] = 0 },
            CancellationToken.None);

        ViewStats stats = await store.ReadAsync(CancellationToken.None);
        Assert.Equal(0, stats.Total);
        Assert.Empty(stats.Countries);
    }

    // Losing every attempt must surface as the store giving up, not as the last raw race.
    [Fact]
    public async Task GivesUpAfterTooManyLostRaces()
    {
        FakeCounterTable table = new() { FailuresToInject = 99 };
        TableViewStore store = new(table, Incrementer(table, 5));

        ConcurrencyException failure = await Assert.ThrowsAsync<ConcurrencyException>(
            () => store.RecordAsync("RO", CancellationToken.None));

        Assert.Contains("Gave up incrementing", failure.Message, StringComparison.Ordinal);
    }

    /// <summary>A store over this table, with the increment retried as the real one is.</summary>
    private static TableViewStore Store(FakeCounterTable table, int attempts)
    {
        return new TableViewStore(table, Incrementer(table, attempts));
    }

    private static CounterIncrementer Incrementer(FakeCounterTable table, int attempts)
    {
        return new CounterIncrementer(table, new ConcurrencyRetryPolicy(attempts));
    }
}
