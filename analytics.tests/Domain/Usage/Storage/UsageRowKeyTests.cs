namespace Analytics.Tests.Domain.Usage.Storage;

using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Storage;
using Xunit;

public sealed class UsageRowKeyTests
{
    [Fact]
    public void KeepsEachDayInItsOwnPartition()
    {
        string first = UsageRowKey.PartitionFor(new DateOnly(2026, 9, 6));
        string second = UsageRowKey.PartitionFor(new DateOnly(2026, 9, 7));

        Assert.Equal("usage-2026-09-06", first);
        Assert.NotEqual(first, second);
    }

    // The view counter reads its partition on every request, so usage rows must never land in it.
    [Fact]
    public void KeepsUsageOutOfTheViewCountersPartition()
    {
        Assert.NotEqual(
            Analytics.Domain.Views.CounterRowKey.Partition,
            UsageRowKey.PartitionFor(new DateOnly(2026, 9, 6)));
    }

    [Fact]
    public void NamesAnOperationAfterItsWireName()
    {
        Assert.Equal("op.cv.download.pdf", UsageRowKey.ForOperation(InteractionCatalogue.CvPdf));
    }

    [Fact]
    public void ReadsTheWireNameBackOut()
    {
        string rowKey = UsageRowKey.ForOperation(InteractionCatalogue.ProjectRead);

        Assert.True(UsageRowKey.IsOperation(rowKey));
        Assert.Equal(InteractionCatalogue.ProjectRead.Name, UsageRowKey.OperationOf(rowKey));
    }

    // The two reserved rows are not operations, and a kind called "views" could not shadow one:
    // operations are prefixed and the reserved rows are not.
    [Theory]
    [InlineData(UsageRowKey.Views)]
    [InlineData(UsageRowKey.Rejected)]
    public void KeepsTheReservedRowsOutOfReachOfAnyKind(string rowKey)
    {
        Assert.False(UsageRowKey.IsOperation(rowKey));
    }
}
