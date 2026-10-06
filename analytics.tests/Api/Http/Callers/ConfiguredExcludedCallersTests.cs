namespace Analytics.Tests.Api.Http.Callers;

using Analytics.Api.Http.Callers;
using Analytics.Infrastructure.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

/// <summary>Which callers' visits are left uncounted. Documentation ranges only, never a real address.</summary>
public sealed class ConfiguredExcludedCallersTests
{
    [Fact]
    public void ExcludesAListedAddress()
    {
        Assert.True(Build("203.0.113.7").IsExcluded("203.0.113.7"));
    }

    [Fact]
    public void CountsAnyOtherAddress()
    {
        Assert.False(Build("203.0.113.7").IsExcluded("203.0.113.8"));
    }

    // A home connection's address can move within its provider's block
    [Fact]
    public void ExcludesEveryAddressInAListedRange()
    {
        ConfiguredExcludedCallers callers = Build("198.51.100.0/24");

        Assert.True(callers.IsExcluded("198.51.100.1"));
        Assert.True(callers.IsExcluded("198.51.100.254"));
        Assert.False(callers.IsExcluded("198.51.101.1"));
    }

    [Fact]
    public void ReadsSeveralEntriesAndIPv6()
    {
        ConfiguredExcludedCallers callers = Build(" 203.0.113.7 , 2001:db8::/32 ");

        Assert.True(callers.IsExcluded("203.0.113.7"));
        Assert.True(callers.IsExcluded("2001:db8::1"));
        Assert.False(callers.IsExcluded("2001:db9::1"));
    }

    [Fact]
    public void MatchesAnIPv4AddressWrittenAsIPv6()
    {
        Assert.True(Build("203.0.113.7").IsExcluded("::ffff:203.0.113.7"));
    }

    // Behind the ingress the caller is the hop before the trusted proxy, not the first in the header
    [Fact]
    public void ReadsTheCallerTheSameWayAsTheCountry()
    {
        ConfiguredExcludedCallers callers = Build("203.0.113.7", trustedProxies: 1);

        Assert.True(callers.IsExcluded("192.0.2.50, 203.0.113.7, 10.0.0.4"));
        Assert.False(callers.IsExcluded("203.0.113.7, 192.0.2.50, 10.0.0.4"));
    }

    [Fact]
    public void SkipsAnUnreadableEntryAndKeepsTheRest()
    {
        ConfiguredExcludedCallers callers = Build("not-an-address, 203.0.113.7, 198.51.100.0/99");

        Assert.True(callers.IsExcluded("203.0.113.7"));
        Assert.False(callers.IsExcluded("198.51.100.1"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("garbage")]
    public void CountsACallerWhoseAddressCannotBeRead(string? forwardedFor)
    {
        Assert.False(Build("203.0.113.7").IsExcluded(forwardedFor));
    }

    [Fact]
    public void ExcludesNobodyWhenNothingIsConfigured()
    {
        Assert.False(Build(string.Empty).IsExcluded("203.0.113.7"));
    }

    private static ConfiguredExcludedCallers Build(string excluded, int trustedProxies = 0)
    {
        CounterOptions options = new()
        {
            AzureWebJobsStorage = "UseDevelopmentStorage=true",
            ExcludedAddresses = excluded,
            TrustedProxyCount = trustedProxies,
        };

        return new ConfiguredExcludedCallers(Options.Create(options), NullLogger<ConfiguredExcludedCallers>.Instance);
    }
}
