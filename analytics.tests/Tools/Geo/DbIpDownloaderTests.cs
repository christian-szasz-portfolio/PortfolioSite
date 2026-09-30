namespace Analytics.Tests.Tools.Geo;

using System.IO.Compression;
using System.Net;
using Analytics.Tools.Geo;
using Xunit;

public sealed class DbIpDownloaderTests : IDisposable
{
    private readonly string folder = Directory.CreateTempSubdirectory("dbip-tests").FullName;

    [Fact]
    public void BuildsTheUrlForTheMonthAsked()
    {
        Uri url = DbIpDownloader.UrlFor(new DateTime(2026, 3, 9, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal("https://download.db-ip.com/free/dbip-country-lite-2026-03.mmdb.gz", url.ToString());
    }

    [Fact]
    public async Task UnpacksTheDownloadIntoPlace()
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");
        byte[] payload = "a database"u8.ToArray();

        long size = await Build(HttpStatusCode.OK, Gzip(payload))
            .DownloadAsync(new Uri("https://example.test/db.gz"), target, CancellationToken.None);

        Assert.Equal(payload.Length, size);
        Assert.Equal(payload, await File.ReadAllBytesAsync(target, CancellationToken.None));
    }

    // The claim the old script could not make: a failed fetch must not cost you the database
    // you already had, since the file is gitignored and there is nothing to restore from.
    [Fact]
    public async Task LeavesTheExistingDatabaseAloneWhenTheFetchFails()
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");
        byte[] existing = "the previous database"u8.ToArray();
        await File.WriteAllBytesAsync(target, existing, CancellationToken.None);

        await Assert.ThrowsAsync<HttpRequestException>(
            () => Build(HttpStatusCode.NotFound, []).DownloadAsync(
                new Uri("https://example.test/db.gz"), target, CancellationToken.None));

        Assert.Equal(existing, await File.ReadAllBytesAsync(target, CancellationToken.None));
    }

    [Fact]
    public async Task LeavesNoArchiveOrStagingFileBehind()
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");

        await Build(HttpStatusCode.OK, Gzip("a database"u8.ToArray()))
            .DownloadAsync(new Uri("https://example.test/db.gz"), target, CancellationToken.None);

        Assert.False(File.Exists(target + ".gz"));
        Assert.False(File.Exists(target + ".partial"));
    }

    // The unpacked file lands in the folder the API reads at startup, so it is only ever
    // fetched over a connection that cannot be rewritten on the way.
    [Theory]
    [InlineData("http://download.db-ip.com/free/db.gz")]
    [InlineData("file:///c:/temp/db.gz")]
    [InlineData("ftp://download.db-ip.com/db.gz")]
    public async Task RefusesToFetchOverAnythingButHttps(string source)
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");

        await Assert.ThrowsAsync<ArgumentException>(
            () => Build(HttpStatusCode.OK, Gzip("a database"u8.ToArray()))
                .DownloadAsync(new Uri(source), target, CancellationToken.None));
    }

    // DB-IP publishes no checksum, so the file is proved by being opened and asked a question.
    // A file that fails must leave the database already in place untouched.
    [Fact]
    public async Task KeepsTheDatabaseAlreadyInPlaceWhenTheDownloadIsNotUsable()
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");
        await File.WriteAllTextAsync(target, "the database that already worked", CancellationToken.None);

        await Assert.ThrowsAsync<GeoDatabaseUnusableException>(
            () => Build(HttpStatusCode.OK, Gzip("rubbish"u8.ToArray()), new RejectingCheck())
                .DownloadAsync(new Uri("https://example.test/db.gz"), target, CancellationToken.None));

        Assert.Equal(
            "the database that already worked",
            await File.ReadAllTextAsync(target, CancellationToken.None));
        Assert.False(File.Exists(target + ".partial"));
    }

    [Fact]
    public async Task ReportsADigestOfWhatIsInPlace()
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");
        await Build(HttpStatusCode.OK, Gzip("a database"u8.ToArray()))
            .DownloadAsync(new Uri("https://example.test/db.gz"), target, CancellationToken.None);

        string digest = await DbIpDownloader.DigestOfAsync(target, CancellationToken.None);

        Assert.Equal(64, digest.Length);
        Assert.Equal(digest, await DbIpDownloader.DigestOfAsync(target, CancellationToken.None));
    }

    // The size ceiling is a security control, not tidiness: a gzip stream says nothing
    // trustworthy about how far it expands, so an archive that is small to serve and enormous to
    // unpack would otherwise fill the disk of whoever ran the refresh.
    [Fact]
    public async Task RefusesAnArchiveThatKeepsExpanding()
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");
        byte[] bomb = Gzip(new byte[64 * 1024]);

        GeoDatabaseTooLargeException thrown =
            await Assert.ThrowsAsync<GeoDatabaseTooLargeException>(
                () => new DbIpDownloader(
                        new HttpClient(new StubHandler(HttpStatusCode.OK, bomb)),
                        new AcceptingCheck(),
                        maxUnpackedBytes: 1024)
                    .DownloadAsync(new Uri("https://example.test/db.gz"), target, CancellationToken.None));

        Assert.Equal(1024, thrown.LimitBytes);
        Assert.False(File.Exists(target));
        Assert.False(File.Exists(target + ".partial"));
    }

    // One catch covers both ways a refresh can fail, and both leave the old database alone.
    [Fact]
    public async Task ReportsEveryRefusalAsAGeoDatabaseFailure()
    {
        string target = Path.Combine(this.folder, "dbip.mmdb");
        await File.WriteAllTextAsync(target, "the database that already worked", CancellationToken.None);

        await Assert.ThrowsAnyAsync<GeoDatabaseException>(
            () => Build(HttpStatusCode.OK, Gzip("rubbish"u8.ToArray()), new RejectingCheck())
                .DownloadAsync(new Uri("https://example.test/db.gz"), target, CancellationToken.None));

        Assert.Equal(
            "the database that already worked",
            await File.ReadAllTextAsync(target, CancellationToken.None));
    }

    public void Dispose()
    {
        Directory.Delete(this.folder, recursive: true);
    }

    private static DbIpDownloader Build(HttpStatusCode status, byte[] body)
    {
        return Build(status, body, new AcceptingCheck());
    }

    private static DbIpDownloader Build(HttpStatusCode status, byte[] body, IDatabaseCheck check)
    {
        return new DbIpDownloader(new HttpClient(new StubHandler(status, body)), check);
    }

    private static byte[] Gzip(byte[] plain)
    {
        using MemoryStream output = new();
        using (GZipStream gzip = new(output, CompressionMode.Compress, leaveOpen: true))
        {
            gzip.Write(plain);
        }

        return output.ToArray();
    }

    /// <summary>Takes any file. Most of these tests are about the fetch, not the contents.</summary>
    private sealed class AcceptingCheck : IDatabaseCheck
    {
        public void Verify(string path)
        {
        }
    }

    /// <summary>Rejects every file, standing in for a download that is not a usable database.</summary>
    private sealed class RejectingCheck : IDatabaseCheck
    {
        public void Verify(string path)
        {
            throw new GeoDatabaseUnusableException("not a database");
        }
    }

    /// <summary>Answers every request with the status and body a test hands it.</summary>
    private sealed class StubHandler(HttpStatusCode status, byte[] body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(status) { Content = new ByteArrayContent(body) });
        }
    }
}
