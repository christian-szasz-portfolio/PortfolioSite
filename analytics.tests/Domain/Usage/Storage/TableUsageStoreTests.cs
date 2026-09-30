namespace Analytics.Tests.Domain.Usage.Storage;

using Analytics.Domain.Resilience;
using Analytics.Domain.Storage;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Domain.Usage.Storage;
using Analytics.Tests.Fakes;
using Xunit;

public sealed class TableUsageStoreTests
{
    private static readonly DateOnly Day = new(2026, 9, 6);
    private static readonly DateOnly NextDay = new(2026, 9, 7);
    private static readonly CancellationToken None = CancellationToken.None;

    private readonly FakeCounterTable table = new();

    [Fact]
    public async Task ReadsBackWhatItStored()
    {
        TableUsageStore store = this.Store();

        await store.ApplyAsync(Day, Counted(views: 12, routes: 4, rejected: 1), None);

        AnalyticsSummary read = await store.ReadAsync(Day, None);

        Assert.Equal(12, read.Views);
        Assert.Equal(1, read.Rejected);
        Assert.Equal(InteractionCatalogue.Route, Assert.Single(read.Operations).Kind);
        Assert.Equal(4, read.Operations[0].Count);
    }

    // Flushes are frequent and a day is one row per operation, so the second flush of a day has
    // to add to the first rather than replace it.
    [Fact]
    public async Task AddsEachFlushToTheDayAlreadyThere()
    {
        TableUsageStore store = this.Store();

        await store.ApplyAsync(Day, Counted(views: 3, routes: 2, rejected: 0), None);
        await store.ApplyAsync(Day, Counted(views: 5, routes: 1, rejected: 0), None);

        AnalyticsSummary read = await store.ReadAsync(Day, None);

        Assert.Equal(8, read.Views);
        Assert.Equal(3, read.Operations[0].Count);
    }

    [Fact]
    public async Task KeepsOneDayOutOfAnother()
    {
        TableUsageStore store = this.Store();

        await store.ApplyAsync(Day, Counted(views: 3, routes: 1, rejected: 0), None);
        await store.ApplyAsync(NextDay, Counted(views: 9, routes: 1, rejected: 0), None);

        Assert.Equal(3, (await store.ReadAsync(Day, None)).Views);
        Assert.Equal(9, (await store.ReadAsync(NextDay, None)).Views);
    }

    [Fact]
    public async Task SaysNothingHappenedOnADayNothingWasStoredFor()
    {
        Assert.False((await this.Store().ReadAsync(Day, None)).HasAnything);
    }

    [Fact]
    public async Task WritesNoRowForAnOperationNobodyPerformed()
    {
        TableUsageStore store = this.Store();

        await store.ApplyAsync(Day, AnalyticsSummary.Of(0, [], 0), None);

        Assert.Empty(await this.table.ListAsync(UsageRowKey.PartitionFor(Day), None));
    }

    // A kind dropped from the catalogue leaves its rows behind. They are left out rather than
    // guessed at, because without a kind there is nothing to call them in the email, and putting
    // the kind back brings its history back with it.
    [Fact]
    public async Task LeavesOutARowWhoseKindTheCatalogueNoLongerKnows()
    {
        this.table.Seed(UsageRowKey.PartitionFor(Day), "op.retired.thing", 7);
        this.table.Seed(UsageRowKey.PartitionFor(Day), UsageRowKey.Views, 2);

        AnalyticsSummary read = await this.Store().ReadAsync(Day, None);

        Assert.Equal(2, read.Views);
        Assert.Empty(read.Operations);
    }

    // The same ETag retry the view counter uses, because it is the same increment.
    [Fact]
    public async Task KeepsCountingThroughALostRace()
    {
        this.table.FailuresToInject = 2;

        await this.Store().ApplyAsync(Day, Counted(views: 4, routes: 0, rejected: 0), None);

        Assert.Equal(4, (await this.Store().ReadAsync(Day, None)).Views);
    }

    private TableUsageStore Store()
    {
        return new TableUsageStore(
            this.table,
            new CounterIncrementer(this.table, new ConcurrencyRetryPolicy(5)),
            new InteractionCatalogue());
    }

    private static AnalyticsSummary Counted(int views, int routes, int rejected)
    {
        return AnalyticsSummary.Of(
            views, [new OperationCount(InteractionCatalogue.Route, routes)], rejected);
    }
}
