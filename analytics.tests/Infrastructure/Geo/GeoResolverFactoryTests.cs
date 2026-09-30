namespace Analytics.Tests.Infrastructure.Geo;

using Analytics.Domain.Abstractions.Geography;
using Analytics.Infrastructure.Configuration;
using Analytics.Infrastructure.Geo;
using Analytics.Tests.Fakes;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

public sealed class GeoResolverFactoryTests
{
    // The database is deliberately not committed, so a missing file must not stop the counter.
    [Fact]
    public void FallsBackToTheNullResolverWhenTheDatabaseIsNotThere()
    {
        GeoResolverFactory factory = new(
            Options.Create(Settings()), new FakeFileProbe(), NullLogger<GeoResolverFactory>.Instance);

        IGeoResolver resolver = factory.Create();

        Assert.IsType<NullGeoResolver>(resolver);
        Assert.Equal(IGeoResolver.Unknown, resolver.ResolveCountry("81.196.0.1"));
    }

    [Fact]
    public void LooksForTheDatabaseBesideTheRunningHost()
    {
        FakeFileProbe files = new();

        new GeoResolverFactory(Options.Create(Settings()), files, NullLogger<GeoResolverFactory>.Instance)
            .Create();

        string asked = Assert.Single(files.Asked);
        Assert.Equal(Path.Combine(AppContext.BaseDirectory, Path.Combine("Data", "dbip.mmdb")), asked);
    }

    private static CounterOptions Settings()
    {
        return new CounterOptions
        {
            AzureWebJobsStorage = "UseDevelopmentStorage=true",
            GeoDatabasePath = Path.Combine("Data", "dbip.mmdb"),
        };
    }
}
