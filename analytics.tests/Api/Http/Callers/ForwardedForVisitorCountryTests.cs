namespace Analytics.Tests.Api.Http.Callers;

using Analytics.Api.Http.Callers;
using Analytics.Domain.Abstractions.Geography;
using Analytics.Infrastructure.Configuration;
using Analytics.Infrastructure.Geo;
using Microsoft.Extensions.Logging;
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

    // The email counts these, so it must say which of the four ways a country goes missing it was.
    [Fact]
    public void SaysSoWhenTheRequestCarriedNoAddress()
    {
        RecordingLogger log = new();

        Build(new NullGeoResolver(), logger: log).Resolve(null);

        Assert.Equal(LogLevel.Warning, Assert.Single(log.Entries).Level);
        Assert.Contains("no address", Assert.Single(log.Entries).Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("not-an-address", "could not be read")]
    [InlineData("10.1.2.3", "private, shared or special")]
    [InlineData("100.64.5.5", "private, shared or special")]
    [InlineData("fd00::1234", "private, shared or special")]
    [InlineData("81.196.0.1", "has no country for")]
    public void SaysWhichKindOfAddressItCouldNotPlace(string forwardedFor, string expected)
    {
        RecordingLogger log = new();

        Build(new NullGeoResolver(), logger: log).Resolve(forwardedFor);

        Assert.Contains(expected, Assert.Single(log.Entries).Message, StringComparison.Ordinal);
    }

    // The privacy notice says the address is never recorded, and a log line is a record.
    [Theory]
    [InlineData("81.196.0.1")]
    [InlineData("10.1.2.3:5555")]
    [InlineData("2001:db8::7")]
    public void NeverPutsTheAddressInTheLog(string forwardedFor)
    {
        RecordingLogger log = new();

        Build(new NullGeoResolver(), logger: log).Resolve(forwardedFor);

        Assert.DoesNotContain(forwardedFor.Split(':')[0], Assert.Single(log.Entries).Message, StringComparison.Ordinal);
    }

    [Fact]
    public void LogsNothingWhenTheCountryWasFound()
    {
        RecordingLogger log = new();

        string country = Build(new FixedGeoResolver("RO"), logger: log).Resolve("81.196.0.1");

        Assert.Equal("RO", country);
        Assert.Empty(log.Entries);
    }

    private static ForwardedForVisitorCountry Build(
        IGeoResolver geo, int trustedProxies = 0, ILogger<ForwardedForVisitorCountry>? logger = null)
    {
        CounterOptions options = new()
        {
            AzureWebJobsStorage = "UseDevelopmentStorage=true",
            TrustedProxyCount = trustedProxies,
        };

        return new ForwardedForVisitorCountry(
            geo,
            Options.Create(options),
            logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<ForwardedForVisitorCountry>.Instance);
    }

    private sealed class FixedGeoResolver(string country) : IGeoResolver
    {
        public string ResolveCountry(string? ip)
        {
            return country;
        }
    }

    private sealed class RecordingLogger : ILogger<ForwardedForVisitorCountry>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull
        {
            return null;
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return true;
        }

        public void Log<TState>(
            LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            this.Entries.Add((logLevel, formatter(state, exception)));
        }
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
