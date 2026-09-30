namespace Analytics.Tests.Domain.Views;

using Analytics.Domain.Abstractions.Geography;
using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Models;
using Analytics.Domain.Resilience;
using Analytics.Domain.Storage;
using Analytics.Domain.Views;
using Analytics.Tests.Fakes;
using Xunit;

public sealed class TableViewStoreTests
{
    private static readonly CancellationToken None = CancellationToken.None;

    [Fact]
    public async Task ReadReturnsZeroWhenEmpty()
    {
        TableViewStore store = Store(new FakeCounterTable(), 5);

        ViewStats stats = await store.ReadAsync(None);

        Assert.Equal(0, stats.Total);
        Assert.Empty(stats.Countries);
    }

    [Fact]
    public async Task RecordIncrementsTotalAndCountry()
    {
        TableViewStore store = Store(new FakeCounterTable(), 5);

        ViewStats stats = await store.RecordAsync("RO", None);

        Assert.Equal(1, stats.Total);
        CountryCount only = Assert.Single(stats.Countries);
        Assert.Equal("RO", only.Code);
        Assert.Equal(1, only.Count);
    }

    [Fact]
    public async Task CountriesAreSortedMostViewedFirst()
    {
        TableViewStore store = Store(new FakeCounterTable(), 5);

        await store.RecordAsync("RO", None);
        await store.RecordAsync("DE", None);
        ViewStats stats = await store.RecordAsync("RO", None);

        Assert.Equal(3, stats.Total);
        Assert.Collection(
            stats.Countries,
            first => Assert.Equal(("RO", 2L), (first.Code, first.Count)),
            second => Assert.Equal(("DE", 1L), (second.Code, second.Count)));
    }

    [Theory]
    [InlineData("ro", "RO")]
    [InlineData("De", "DE")]
    public async Task CountryCodeIsNormalisedToUppercase(string input, string expected)
    {
        TableViewStore store = Store(new FakeCounterTable(), 5);

        ViewStats stats = await store.RecordAsync(input, None);

        Assert.Equal(expected, Assert.Single(stats.Countries).Code);
    }

    [Theory]
    [InlineData("XYZ")]
    [InlineData("")]
    [InlineData("1")]
    public async Task UnrecognisedCountryFallsBackToUnknown(string input)
    {
        TableViewStore store = Store(new FakeCounterTable(), 5);

        ViewStats stats = await store.RecordAsync(input, None);

        Assert.Equal(IGeoResolver.Unknown, Assert.Single(stats.Countries).Code);
    }

    [Fact]
    public async Task RetriesThroughConcurrencyFailures()
    {
        FakeCounterTable table = new();
        table.Seed(CounterRowKey.Partition, "TOTAL", 41);
        table.Seed(CounterRowKey.Partition, "C_RO", 4);

        // Fail the first two writes (one on TOTAL, one on the country row), then succeed.
        table.FailuresToInject = 2;
        TableViewStore store = new(table, Incrementer(table, 5));

        ViewStats stats = await store.RecordAsync("RO", None);

        Assert.Equal(42, stats.Total);
        Assert.Equal(5, Assert.Single(stats.Countries).Count);
    }

    [Fact]
    public async Task GivesUpAfterTooManyConcurrencyFailures()
    {
        FakeCounterTable table = new();
        table.Seed(CounterRowKey.Partition, "TOTAL", 1);
        table.FailuresToInject = 99;
        TableViewStore store = new(table, Incrementer(table, 5));

        await Assert.ThrowsAsync<ConcurrencyException>(() => store.RecordAsync("RO", None));
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
