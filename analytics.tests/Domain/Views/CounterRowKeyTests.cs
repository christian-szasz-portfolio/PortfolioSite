namespace Analytics.Tests.Domain.Views;

using Analytics.Domain.Views;
using Xunit;

public sealed class CounterRowKeyTests
{
    [Theory]
    [InlineData("RO", "RO")]
    [InlineData("ro", "RO")]
    [InlineData("nonsense", "ZZ")]
    public void RoundTripsACountryThroughItsRowKey(string country, string expected)
    {
        string rowKey = CounterRowKey.ForCountry(country);

        Assert.True(CounterRowKey.IsCountry(rowKey));
        Assert.Equal(expected, CounterRowKey.CountryOf(rowKey));
    }

    // The total shares the partition with the country rows, so it must not read as one.
    [Fact]
    public void TheTotalIsNotACountryRow()
    {
        Assert.False(CounterRowKey.IsCountry(CounterRowKey.Total));
    }
}
