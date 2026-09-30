namespace Analytics.Tests.Tools.Geo;

using Analytics.Tools.Geo;
using Xunit;

public sealed class MaxMindDatabaseCheckTests : IDisposable
{
    private readonly string folder = Directory.CreateTempSubdirectory("mmdb-tests").FullName;
    private readonly MaxMindDatabaseCheck check = new();

    // The reader throws its own types for a malformed file. They all mean one thing here, and the
    // caller should not have to know which of them MaxMind chose.
    [Fact]
    public void CallsAFileThatIsNotADatabaseUnusable()
    {
        string path = Path.Combine(this.folder, "not-a-database.mmdb");
        File.WriteAllText(path, "this is plainly not a MaxMind database");

        GeoDatabaseUnusableException thrown =
            Assert.Throws<GeoDatabaseUnusableException>(() => this.check.Verify(path));

        Assert.Contains("not a readable MaxMind database", thrown.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void CallsAMissingFileUnusableToo()
    {
        Assert.Throws<GeoDatabaseUnusableException>(
            () => this.check.Verify(Path.Combine(this.folder, "absent.mmdb")));
    }

    // One catch at the call site covers every way a refresh can fail.
    [Fact]
    public void ReportsItUnderTheSharedBaseType()
    {
        string path = Path.Combine(this.folder, "not-a-database.mmdb");
        File.WriteAllText(path, "still not a database");

        Assert.IsType<GeoDatabaseException>(
            Assert.ThrowsAny<GeoDatabaseException>(() => this.check.Verify(path)), exactMatch: false);
    }

    public void Dispose()
    {
        Directory.Delete(this.folder, recursive: true);
    }
}
