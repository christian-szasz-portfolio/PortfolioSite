namespace Admin.Tests.Configuration;

using Admin.Api.Configuration;
using Xunit;

/// <summary>Saying whether the figures are real, without spelling out the key while it does.</summary>
public sealed class AdminOptionsTests
{
    [Theory]
    [InlineData("UseDevelopmentStorage=true")]
    [InlineData("usedevelopmentstorage=TRUE")]
    [InlineData("DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=abc;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;")]
    public void KnowsTheEmulatorHoweverItIsSpelt(string connection)
    {
        AdminOptions options = new() { AzureWebJobsStorage = connection };

        Assert.True(options.UsesEmulator());
        Assert.Equal("Azurite emulator", options.SourceName());
    }

    [Fact]
    public void CallsARealAccountLive()
    {
        AdminOptions options = new()
        {
            AzureWebJobsStorage =
                "DefaultEndpointsProtocol=https;AccountName=portfolioanalytics;AccountKey=c2VjcmV0;EndpointSuffix=core.windows.net",
        };

        Assert.False(options.UsesEmulator());
    }

    [Fact]
    public void NamesTheAccountAndNothingElse()
    {
        AdminOptions options = new()
        {
            AzureWebJobsStorage =
                "DefaultEndpointsProtocol=https;AccountName=portfolioanalytics;AccountKey=c2VjcmV0;EndpointSuffix=core.windows.net",
        };

        // The name says which storage; the key would say how to get into it, and this is answered
        // over HTTP to a page.
        Assert.Equal("portfolioanalytics", options.SourceName());
        Assert.DoesNotContain("c2VjcmV0", options.SourceName(), StringComparison.Ordinal);
    }

    [Fact]
    public void FallsBackToASafeNameWhenTheStringNamesNoAccount()
    {
        AdminOptions options = new() { AzureWebJobsStorage = "SharedAccessSignature=sv=2024-11-04" };

        Assert.Equal("Azure storage", options.SourceName());
    }

    [Fact]
    public void DefaultsToTheEmulator()
    {
        // The default is the safe one: a tool started with nothing configured reads a laptop
        // rather than production.
        Assert.True(new AdminOptions().UsesEmulator());
    }

    [Fact]
    public void KeepsTheArchiveOutOfTheRepositoryByDefault()
    {
        string resolved = new AdminOptions().ResolvedDataRoot();

        Assert.EndsWith("analytics-admin", resolved, StringComparison.Ordinal);
        Assert.True(Path.IsPathRooted(resolved));
    }

    [Fact]
    public void UsesTheFolderItWasGiven()
    {
        AdminOptions options = new() { DataRoot = @"D:\somewhere\else" };

        Assert.Equal(@"D:\somewhere\else", options.ResolvedDataRoot());
    }
}
