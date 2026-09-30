namespace Analytics.Tests.Infrastructure.Diagnostics.Resolution;

using Analytics.Infrastructure.Diagnostics;
using Analytics.Tests.Fakes;
using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Capture;
using Common.Diagnostics.Composition;
using Common.Diagnostics.Composition.Sections;
using Common.Diagnostics.Models;
using Common.Diagnostics.Storage;
using Xunit;

/// <summary>Three apps write into one day and one email comes out of it.</summary>
public sealed class CombinedDigestTests
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 23, 12, 0, 0, TimeSpan.Zero);

    private static readonly DateOnly Day = new(2026, 9, 23);

    private readonly FakeLogTable table = new();

    [Fact]
    public async Task SectionsEveryAppThatWroteIntoTheDay()
    {
        await this.WriteAsync(PortfolioApps.Analytics, "Analytics.Infrastructure.Buffering.ViewFlushService");
        await this.WriteAsync(PortfolioApps.Stack86, "Stack86.Api.Controllers.CompilerController");
        await this.WriteAsync(PortfolioApps.Taskly, "Taskly.Web.Demo.DemoStore");

        LogDigest digest = await this.ComposeAsync();

        Assert.Contains("Analytics / Buffering", digest.Html, StringComparison.Ordinal);
        Assert.Contains("Stack86 / Controllers", digest.Html, StringComparison.Ordinal);
        Assert.Contains("Taskly / Demo", digest.Html, StringComparison.Ordinal);
    }

    /// <summary>One email for the whole portfolio, not one per app.</summary>
    [Fact]
    public async Task NamesThePortfolioInTheSubjectRatherThanOneApp()
    {
        await this.WriteAsync(PortfolioApps.Stack86, "Stack86.Api.Controllers.CompilerController");

        LogDigest digest = await this.ComposeAsync();

        Assert.StartsWith("[portfolio]", digest.Subject, StringComparison.Ordinal);
    }

    /// <summary>The same framework category from two apps stays two sections.</summary>
    [Fact]
    public async Task KeepsFrameworkNoiseWithTheAppThatProducedIt()
    {
        const string category = "Microsoft.AspNetCore.Server.Kestrel";

        await this.WriteAsync(PortfolioApps.Stack86, category);
        await this.WriteAsync(PortfolioApps.Taskly, category);

        LogDigest digest = await this.ComposeAsync();

        Assert.Contains("Stack86 / Microsoft", digest.Html, StringComparison.Ordinal);
        Assert.Contains("Taskly / Microsoft", digest.Html, StringComparison.Ordinal);
    }

    private async Task WriteAsync(string app, string category)
    {
        ILogStore store = new TableLogStore(
            this.table, PortfolioDomainResolver.Create(), TimeProvider.System, app);

        // The domain written here is discarded: the section is worked out on the way out.
        await store.AppendAsync(
            Day,
            [LogEntry.Note(Noon, LogSeverity.Warning, LogDomain.Unknown, category, "something happened")],
            0,
            CancellationToken.None);
    }

    private async Task<LogDigest> ComposeAsync()
    {
        ILogStore store = new TableLogStore(
            this.table, PortfolioDomainResolver.Create(), TimeProvider.System, PortfolioApps.Analytics);

        StoredLog stored = await store.ReadAsync(Day, CancellationToken.None);

        DigestComposer composer = new(
            () => new HtmlEmailBuilder(),
            new SectionRendererFactory([new FailureSectionRenderer(), new NoteSectionRenderer()]),
            TimeProvider.System,
            "portfolio");

        return composer.Compose(new DigestWindow(Day, stored.Entries, stored.Dropped, []));
    }
}
