namespace Analytics.Tests.Domain.Models;

using Analytics.Domain.Models;
using Xunit;

public sealed class ViewStatsTests
{
    [Fact]
    public void CombiningNothingLeavesTheTalliesAlone()
    {
        ViewStats stored = new(5, [new CountryCount("RO", 5)]);

        Assert.Same(stored, stored.CombinedWith(new Dictionary<string, long>(StringComparer.Ordinal)));
    }

    [Fact]
    public void AddsBufferedCountsToTheCountriesAlreadyThere()
    {
        ViewStats stored = new(7, [new CountryCount("RO", 5), new CountryCount("SE", 2)]);

        ViewStats combined = stored.CombinedWith(
            new Dictionary<string, long>(StringComparer.Ordinal) { ["RO"] = 3, ["DE"] = 1 });

        Assert.Equal(11, combined.Total);
        Assert.Equal(8, combined.Countries.Single(country => country.Code == "RO").Count);
        Assert.Equal(2, combined.Countries.Single(country => country.Code == "SE").Count);
        Assert.Equal(1, combined.Countries.Single(country => country.Code == "DE").Count);
    }

    // The API promises most viewed first, and a buffered count can change the order.
    [Fact]
    public void KeepsTheMostViewedFirstAfterCombining()
    {
        ViewStats stored = new(3, [new CountryCount("SE", 2), new CountryCount("RO", 1)]);

        ViewStats combined = stored.CombinedWith(
            new Dictionary<string, long>(StringComparer.Ordinal) { ["RO"] = 9 });

        Assert.Equal("RO", combined.Countries[0].Code);
        Assert.Equal("SE", combined.Countries[1].Code);
    }

    [Fact]
    public void EmptyIsZeroAndHasNoCountries()
    {
        Assert.Equal(0, ViewStats.Empty.Total);
        Assert.Empty(ViewStats.Empty.Countries);
    }
}
