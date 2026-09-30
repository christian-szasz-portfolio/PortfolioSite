namespace Analytics.Tests.Domain.Usage.Storage;

using Analytics.Domain.Usage.Storage;
using Analytics.Domain.Views;
using Analytics.Tests.Fakes;
using Xunit;

public sealed class UsageRetentionTests
{
    private static readonly DateOnly Today = new(2026, 9, 6);
    private static readonly CancellationToken None = CancellationToken.None;

    private readonly FakeCounterTable table = new();

    [Fact]
    public async Task DropsADayOlderThanTheWindow()
    {
        this.Store(new DateOnly(2026, 8, 1));

        int dropped = await this.Retention().DropBeforeAsync(new DateOnly(2026, 8, 7), None);

        Assert.Equal(1, dropped);
        Assert.Empty(await this.table.ListPartitionsAsync(UsageRowKey.PartitionPrefix, None));
    }

    [Fact]
    public async Task KeepsTheDayTheWindowStartsOn()
    {
        this.Store(new DateOnly(2026, 8, 7));

        int dropped = await this.Retention().DropBeforeAsync(new DateOnly(2026, 8, 7), None);

        Assert.Equal(0, dropped);
        Assert.Single(await this.table.ListPartitionsAsync(UsageRowKey.PartitionPrefix, None));
    }

    [Fact]
    public async Task KeepsEveryDayInsideTheWindowAndDropsTheRest()
    {
        for (int back = 0; back < 40; back++)
        {
            this.Store(Today.AddDays(-back));
        }

        int dropped = await this.Retention().DropBeforeAsync(Today.AddDays(-30), None);

        Assert.Equal(9, dropped);
        Assert.Equal(
            31, (await this.table.ListPartitionsAsync(UsageRowKey.PartitionPrefix, None)).Count);
    }

    // It reads names it did not write. A partition it cannot parse as one of our days is left
    // where it is, so nothing that merely shares a prefix can be deleted by this.
    [Fact]
    public async Task LeavesAlonePartitionsItCannotReadAsADay()
    {
        this.table.Seed("usage-not-a-date", "views", 1);

        int dropped = await this.Retention().DropBeforeAsync(Today, None);

        Assert.Equal(0, dropped);
        Assert.Single(await this.table.ListPartitionsAsync(UsageRowKey.PartitionPrefix, None));
    }

    // The view counter's rows are cumulative and are not usage. Retention must never see them.
    [Fact]
    public async Task NeverTouchesTheViewCounter()
    {
        this.table.Seed(CounterRowKey.Partition, CounterRowKey.Total, 4_120);
        this.Store(new DateOnly(2020, 1, 1));

        await this.Retention().DropBeforeAsync(Today, None);

        Assert.Single(await this.table.ListAsync(CounterRowKey.Partition, None));
    }

    [Fact]
    public async Task DoesNothingWhenThereIsNothingToDrop()
    {
        Assert.Equal(0, await this.Retention().DropBeforeAsync(Today, None));
    }

    private UsageRetention Retention()
    {
        return new UsageRetention(this.table);
    }

    private void Store(DateOnly day)
    {
        this.table.Seed(UsageRowKey.PartitionFor(day), UsageRowKey.Views, 1);
        this.table.Seed(UsageRowKey.PartitionFor(day), "op.route", 2);
    }
}
