namespace Analytics.Infrastructure.Geo;

using System.Net;
using Analytics.Domain.Abstractions.Geography;
using MaxMind.GeoIP2;

/// <summary>Resolves countries against the bundled offline DB-IP database, in process.</summary>
public sealed class DbIpGeoResolver(DatabaseReader reader) : IGeoResolver, IDisposable
{
    /// <summary>Opens the database from a file on disk.</summary>
    public DbIpGeoResolver(string databasePath)
        : this(new DatabaseReader(databasePath))
    {
    }

    /// <summary>Opens the database from an already-open stream, which the reader takes over.</summary>
    public DbIpGeoResolver(Stream databaseStream)
        : this(new DatabaseReader(databaseStream))
    {
    }

    public string ResolveCountry(string? ip)
    {
        if (string.IsNullOrWhiteSpace(ip) || !IPAddress.TryParse(ip, out IPAddress? address))
        {
            return IGeoResolver.Unknown;
        }

        // TryCountry never throws for an address that is simply absent; it returns false.
        if (reader.TryCountry(address, out MaxMind.GeoIP2.Responses.CountryResponse? response)
            && response?.Country.IsoCode is { Length: > 0 } code)
        {
            return code;
        }

        return IGeoResolver.Unknown;
    }

    public void Dispose()
    {
        reader.Dispose();
    }
}
