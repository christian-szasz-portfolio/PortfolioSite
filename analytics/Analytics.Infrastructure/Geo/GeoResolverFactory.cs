namespace Analytics.Infrastructure.Geo;

using Analytics.Domain.Abstractions.Geography;
using Analytics.Infrastructure.Configuration;
using MaxMind.GeoIP2;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

/// <summary>The real resolver when the offline database is there, and an unknowing one when it is not.</summary>
public sealed partial class GeoResolverFactory(
    IOptions<CounterOptions> options,
    IFileProbe files,
    ILogger<GeoResolverFactory> logger) : IGeoResolverFactory
{
    public IGeoResolver Create()
    {
        string path = Path.Combine(AppContext.BaseDirectory, options.Value.GeoDatabasePath);

        if (!files.Exists(path))
        {
            // Worth saying out loud once. Without it, the only symptom of a missing database is
            // every visitor quietly resolving to an unknown country, which looks like a bug in
            // the counter rather than a file nobody fetched.
            logger.LogWarning(
                "No GeoIP database at {Path}, so every view is recorded as an unknown country. "
                + "Fetch it with: dotnet run --project analytics/Analytics.Tools",
                path);

            return new NullGeoResolver();
        }

        ResolvingFrom(logger, path);

        return new DbIpGeoResolver(new DatabaseReader(path));
    }

    // Source generated, so the path is not touched when Information is switched off. CA1873 asks
    // for that on anything below Warning that takes an argument.
    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Resolving countries from the GeoIP database at {Path}.")]
    private static partial void ResolvingFrom(ILogger logger, string path);
}
