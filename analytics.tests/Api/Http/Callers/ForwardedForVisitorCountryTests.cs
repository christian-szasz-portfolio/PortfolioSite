namespace Analytics.Tests.Api.Http.Callers;

using Analytics.Api.Http.Callers;
using Analytics.Domain.Abstractions.Geography;
using Analytics.Infrastructure.Configuration;
using Analytics.Infrastructure.Geo;
using Microsoft.Extensions.Options;
using Xunit;

public sealed class ForwardedForVisitorCountryTests
{
    [Fact]
    public void AnswersUnknownWhenTheHeaderIsMissing()
    {
        ForwardedForVisitorCountry visitor = Build(new NullGeoResolver());

        Assert.Equal(IGeoResolver.Unknown, visitor.Resolve(null));
    }

    // The platform appends the address it observed, so that is the one worth looking up.
    [Fact]
    public void LooksUpTheAddressThePlatformObserved()
    {
        RecordingGeoResolver geo = new();

        Build(geo).Resolve("1.1.1.1, 81.196.0.1:51234");

        Assert.Equal("81.196.0.1", geo.LastAsked);
    }

    [Fact]
    public void PassesNothingOnWhenTheHeaderIsNotAnAddress()
    {
        RecordingGeoResolver geo = new();

        Build(geo).Resolve("not-an-address");

        Assert.Null(geo.LastAsked);
    }

    [Fact]
    public void StepsOverAProxyItIsToldToTrust()
    {
        RecordingGeoResolver geo = new();

        Build(geo, trustedProxies: 1).Resolve("81.196.0.1, 10.0.0.1");

        Assert.Equal("81.196.0.1", geo.LastAsked);
    }

    private static ForwardedForVisitorCountry Build(IGeoResolver geo, int trustedProxies = 0)
    {
        CounterOptions options = new()
        {
            AzureWebJobsStorage = "UseDevelopmentStorage=true",
            TrustedProxyCount = trustedProxies,
        };

        return new ForwardedForVisitorCountry(geo, Options.Create(options));
    }

    private sealed class RecordingGeoResolver : IGeoResolver
    {
        public string? LastAsked { get; private set; }

        public string ResolveCountry(string? ip)
        {
            this.LastAsked = ip;
            return IGeoResolver.Unknown;
        }
    }
}
