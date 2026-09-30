namespace Analytics.Tests.Domain.Abstractions.Storage;

using Analytics.Domain.Abstractions.Storage;
using Xunit;

public sealed class CounterWriteTests
{
    [Fact]
    public void AnInsertCarriesNoETagAndSaysItCreatesTheRow()
    {
        CounterWrite write = CounterWrite.Insert("site", "TOTAL", 3);

        Assert.True(write.CreatesRow);
        Assert.Equal("site", write.Partition);
        Assert.Null(write.ETag);
        Assert.Equal("TOTAL", write.RowKey);
        Assert.Equal(3, write.Value);
    }

    [Fact]
    public void AnUpdateCarriesTheETagItIsGuardedBy()
    {
        CounterWrite write = CounterWrite.Update("site", "C_RO", 9, "etag-7");

        Assert.False(write.CreatesRow);
        Assert.Equal("etag-7", write.ETag);
        Assert.Equal(9, write.Value);
    }
}
