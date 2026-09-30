namespace Analytics.Tools.Geo;

using System.Net;
using MaxMind.GeoIP2;

/// <summary>Opens the unpacked file and asks it the same question the API will.</summary>
public sealed class MaxMindDatabaseCheck : IDatabaseCheck
{
    /// <summary>A public address with a settled country, used only to prove the file answers.</summary>
    private static readonly IPAddress KnownAddress = IPAddress.Parse("8.8.8.8");

    public void Verify(string path)
    {
        try
        {
            using DatabaseReader reader = new(path);

            if (!reader.Metadata.DatabaseType.Contains("Country", StringComparison.OrdinalIgnoreCase))
            {
                throw new GeoDatabaseUnusableException(
                    $"The file is a '{reader.Metadata.DatabaseType}' database, not a country one.");
            }

            if (!reader.TryCountry(KnownAddress, out MaxMind.GeoIP2.Responses.CountryResponse? response)
                || string.IsNullOrEmpty(response?.Country.IsoCode))
            {
                throw new GeoDatabaseUnusableException(
                    $"The database resolved no country for {KnownAddress}, so it is not usable.");
            }
        }
        catch (Exception ex) when (ex is not GeoDatabaseException)
        {
            // The reader throws its own types for a malformed file; they all mean the same here.
            throw new GeoDatabaseUnusableException(
                $"The file is not a readable MaxMind database: {ex.Message}", ex);
        }
    }
}
