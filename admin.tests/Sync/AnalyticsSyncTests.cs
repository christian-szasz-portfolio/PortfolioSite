namespace Admin.Tests.Sync;

using Admin.Api.Archive;
using Admin.Api.Configuration;
using Admin.Api.Sync;
using Admin.Tests.Fakes;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Xunit;

public sealed class AnalyticsSyncTests : IDisposable
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 7, 12, 0, 0, TimeSpan.Zero);
    private static readonly CancellationToken None = CancellationToken.None;

    private readonly string root = Path.Combine(
        Path.GetTempPath(), "admin-sync-" + Guid.NewGuid().ToString("N"));

    private readonly FakeUsageStore usage = new();
    private readonly FakeViewStore views = new();
    private readonly FakeTimeProvider time = new(Noon);

    [Fact]
    public async Task ArchivesTheDaysItFinds()
    {
        this.usage.Seed(new DateOnly(2026, 9, 6), Counted(views: 4, routes: 9));
        this.usage.Seed(new DateOnly(2026, 9, 7), Counted(views: 1, routes: 2));

        SyncReport report = await this.Sync().SyncAsync(days: 7, None);

        Assert.Equal(2, report.DaysArchived);
        Assert.Equal(new DateOnly(2026, 9, 1), report.From);
        Assert.Equal(new DateOnly(2026, 9, 7), report.To);
    }

    // The absence of a file is how the archive says nobody came. A file full of zeroes would say
    // something different and would be wrong.
    [Fact]
    public async Task WritesNothingForADayNobodyUsed()
    {
        SyncReport report = await this.Sync().SyncAsync(days: 7, None);

        Assert.Equal(0, report.DaysArchived);
        Assert.Empty(await this.UsageArchive().ReadAllAsync(None));
    }

    [Fact]
    public async Task KeepsTheLabelsTheDayWasCountedUnder()
    {
        this.usage.Seed(new DateOnly(2026, 9, 7), Counted(views: 1, routes: 3));

        await this.Sync().SyncAsync(days: 1, None);

        UsageDay archived = Assert.Single(await this.UsageArchive().ReadAllAsync(None));
        UsageOperation operation = Assert.Single(archived.Operations);

        Assert.Equal("route", operation.Name);
        Assert.Equal("Page opened", operation.Label);
        Assert.Equal(3, operation.Count);
    }

    // A running total says nothing on its own. Two snapshots a week apart are what make it a rate.
    [Fact]
    public async Task TakesASnapshotOfTheCounterEveryTime()
    {
        this.views.Total = 412;

        SyncReport report = await this.Sync().SyncAsync(days: 1, None);
        ViewSnapshot? snapshot = await this.ViewArchive().LatestAsync(None);

        Assert.Equal(412, report.ViewsTotal);
        Assert.Equal(412, snapshot?.Total);
        Assert.Equal(new DateOnly(2026, 9, 7), snapshot?.Day);
    }

    [Fact]
    public async Task AsksForTheWindowItWasGiven()
    {
        await this.Sync().SyncAsync(days: 30, None);

        Assert.Equal(new DateOnly(2026, 8, 9), this.usage.Asked.Min());
        Assert.Equal(new DateOnly(2026, 9, 7), this.usage.Asked.Max());
    }

    public void Dispose()
    {
        if (Directory.Exists(this.root))
        {
            Directory.Delete(this.root, recursive: true);
        }
    }

    private AnalyticsSync Sync()
    {
        return new AnalyticsSync(
            this.usage,
            this.views,
            this.UsageArchive(),
            this.ViewArchive(),
            this.time,
            NullLogger<AnalyticsSync>.Instance);
    }

    private FileUsageArchive UsageArchive()
    {
        return new FileUsageArchive(Options.Create(new AdminOptions { DataRoot = this.root }));
    }

    private FileViewArchive ViewArchive()
    {
        return new FileViewArchive(Options.Create(new AdminOptions { DataRoot = this.root }));
    }

    private static AnalyticsSummary Counted(int views, int routes)
    {
        return AnalyticsSummary.Of(
            views, [new OperationCount(InteractionCatalogue.Route, routes)], 0);
    }
}
