namespace Analytics.Tests.Infrastructure.Geo;

using Analytics.Domain.Abstractions.Geography;
using Analytics.Infrastructure.Geo;
using Xunit;

public sealed class GeoResolverTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("1.2.3.4")]
    [InlineData("garbage")]
    public void NullResolverAlwaysReturnsUnknown(string? ip)
    {
        NullGeoResolver resolver = new();

        Assert.Equal(IGeoResolver.Unknown, resolver.ResolveCountry(ip));
    }
}
