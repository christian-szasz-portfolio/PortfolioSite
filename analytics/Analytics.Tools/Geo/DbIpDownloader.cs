namespace Analytics.Tools.Geo;

using System.IO.Compression;
using System.Security.Cryptography;

// Data source: DB-IP (https://db-ip.com), "IP to Country Lite", under CC BY 4.0.
// Attribution "IP geolocation by DB-IP (https://db-ip.com)" is shown on the site's /cookies page.
// The .mmdb is gitignored, so DB-IP's dataset is not redistributed in this repository.

/// <summary>Fetches the DB-IP IP-to-Country Lite database and unpacks it where the API expects it.</summary>
public sealed class DbIpDownloader(
    HttpClient http,
    IDatabaseCheck check,
    long maxUnpackedBytes = DbIpDownloader.DefaultMaxUnpackedBytes)
{
    /// <summary>The most the unpacked database may come to, overridable so a test can drive the ceiling.</summary>
    public const long DefaultMaxUnpackedBytes = 512L * 1024 * 1024;

    /// <summary>Where DB-IP publishes a given month's database.</summary>
    public static Uri UrlFor(DateTime month)
    {
        return new Uri($"https://download.db-ip.com/free/dbip-country-lite-{month:yyyy-MM}.mmdb.gz");
    }

    /// <summary>Downloads and unpacks the database, returning its size in bytes.</summary>
    public async Task<long> DownloadAsync(Uri source, string databasePath, CancellationToken cancellationToken)
    {
        if (source.Scheme != Uri.UriSchemeHttps)
        {
            // The file goes straight into the folder the API reads at startup, so it is
            // only ever fetched over a connection that cannot be rewritten in transit.
            throw new ArgumentException("The database may only be fetched over HTTPS.", nameof(source));
        }

        string archive = databasePath + ".gz";
        string staging = databasePath + ".partial";

        Directory.CreateDirectory(Path.GetDirectoryName(databasePath) ?? ".");

        try
        {
            await this.FetchAsync(source, archive, cancellationToken);

            await using (FileStream compressed = File.OpenRead(archive))
            await using (GZipStream gzip = new(compressed, CompressionMode.Decompress))
            await using (FileStream plain = File.Create(staging))
            {
                await this.CopyBoundedAsync(gzip, plain, cancellationToken);
            }

            // Prove it before it replaces what is already there. The database is gitignored,
            // so a bad file moved into place leaves nothing to restore from.
            check.Verify(staging);

            File.Move(staging, databasePath, overwrite: true);
        }
        finally
        {
            Delete(archive);
            Delete(staging);
        }

        return new FileInfo(databasePath).Length;
    }

    /// <summary>The digest of the file now in place, recorded rather than verified.</summary>
    public static async Task<string> DigestOfAsync(string databasePath, CancellationToken cancellationToken)
    {
        await using FileStream file = File.OpenRead(databasePath);

        return Convert.ToHexString(await SHA256.HashDataAsync(file, cancellationToken));
    }

    /// <summary>Unpacks with a ceiling, because a gzip stream says nothing about how far it expands.</summary>
    private async Task CopyBoundedAsync(Stream source, Stream target, CancellationToken cancellationToken)
    {
        byte[] buffer = new byte[81920];
        long written = 0;

        int read;
        while ((read = await source.ReadAsync(buffer, cancellationToken)) > 0)
        {
            written += read;
            if (written > maxUnpackedBytes)
            {
                throw new GeoDatabaseTooLargeException(maxUnpackedBytes);
            }

            await target.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
    }

    private static void Delete(string path)
    {
        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }

    private async Task FetchAsync(Uri source, string archive, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response =
            await http.GetAsync(source, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

        // DB-IP publishes a month at a time; a 404 early in the month means it is not up yet.
        response.EnsureSuccessStatusCode();

        await using Stream body = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using FileStream target = File.Create(archive);
        await body.CopyToAsync(target, cancellationToken);
    }
}
