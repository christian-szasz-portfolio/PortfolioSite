namespace Admin.Tests.Archive;

using Admin.Api.Archive;
using Admin.Api.Configuration;
using Microsoft.Extensions.Options;
using Xunit;

/// <summary>The archive is the record, so these are about it not losing what it was given.</summary>
public sealed class FileUsageArchiveTests : IDisposable
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 7, 12, 0, 0, TimeSpan.Zero);
    private static readonly CancellationToken None = CancellationToken.None;

    private readonly string root = Path.Combine(
        Path.GetTempPath(), "admin-archive-" + Guid.NewGuid().ToString("N"));

    [Fact]
    public async Task ReadsBackWhatItWrote()
    {
        FileUsageArchive archive = this.Archive();

        await archive.SaveAsync(Day(new DateOnly(2026, 9, 6), views: 4, interactions: 9), None);

        UsageDay read = Assert.Single(await archive.ReadAllAsync(None));

        Assert.Equal(new DateOnly(2026, 9, 6), read.Day);
        Assert.Equal(4, read.Views);
        Assert.Equal(9, read.Interactions);
        Assert.Equal("Page opened", Assert.Single(read.Operations).Label);
    }

    // A sync runs again over days it has already archived, and the newer read is the better one.
    [Fact]
    public async Task ReplacesADayItAlreadyHeld()
    {
        FileUsageArchive archive = this.Archive();
        DateOnly day = new(2026, 9, 6);

        await archive.SaveAsync(Day(day, views: 1, interactions: 1), None);
        await archive.SaveAsync(Day(day, views: 8, interactions: 20), None);

        UsageDay read = Assert.Single(await archive.ReadAllAsync(None));

        Assert.Equal(8, read.Views);
    }

    [Fact]
    public async Task KeepsTheDaysInOrder()
    {
        FileUsageArchive archive = this.Archive();

        await archive.SaveAsync(Day(new DateOnly(2026, 9, 7), 1, 1), None);
        await archive.SaveAsync(Day(new DateOnly(2026, 8, 30), 1, 1), None);
        await archive.SaveAsync(Day(new DateOnly(2026, 9, 1), 1, 1), None);

        IReadOnlyList<UsageDay> days = await archive.ReadAllAsync(None);

        Assert.Equal(
            [new DateOnly(2026, 8, 30), new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 7)],
            days.Select(day => day.Day));
    }

    [Fact]
    public async Task ReadsOnlyTheRangeAsked()
    {
        FileUsageArchive archive = this.Archive();

        await archive.SaveAsync(Day(new DateOnly(2026, 9, 1), 1, 1), None);
        await archive.SaveAsync(Day(new DateOnly(2026, 9, 5), 1, 1), None);
        await archive.SaveAsync(Day(new DateOnly(2026, 9, 9), 1, 1), None);

        IReadOnlyList<UsageDay> days =
            await archive.ReadAsync(new DateOnly(2026, 9, 4), new DateOnly(2026, 9, 6), None);

        Assert.Equal(new DateOnly(2026, 9, 5), Assert.Single(days).Day);
    }

    [Fact]
    public async Task SaysNothingIsThereBeforeTheFirstSync()
    {
        Assert.Empty(await this.Archive().ReadAllAsync(None));
    }

    // These are files on a disk somebody can open. One that has been edited into nonsense is a
    // reason to skip that day, not to lose the years around it.
    [Fact]
    public async Task SkipsAFileItCannotRead()
    {
        FileUsageArchive archive = this.Archive();
        await archive.SaveAsync(Day(new DateOnly(2026, 9, 6), 3, 3), None);

        await File.WriteAllTextAsync(
            Path.Combine(this.root, "usage", "2026-09-05.json"), "{ not json", None);

        UsageDay read = Assert.Single(await archive.ReadAllAsync(None));

        Assert.Equal(new DateOnly(2026, 9, 6), read.Day);
    }

    public void Dispose()
    {
        if (Directory.Exists(this.root))
        {
            Directory.Delete(this.root, recursive: true);
        }
    }

    private FileUsageArchive Archive()
    {
        return new FileUsageArchive(Options.Create(new AdminOptions { DataRoot = this.root }));
    }

    private static UsageDay Day(DateOnly day, int views, int interactions)
    {
        return new UsageDay(
            day,
            views,
            interactions,
            0,
            [new UsageOperation("route", "Page opened", interactions)],
            Noon);
    }
}
