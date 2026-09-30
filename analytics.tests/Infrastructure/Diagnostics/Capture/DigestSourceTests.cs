namespace Analytics.Tests.Infrastructure.Diagnostics.Capture;

using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Infrastructure.Diagnostics;
using Analytics.Tests.Fakes;
using Common.Diagnostics.Capture;
using Common.Diagnostics.Models;
using Xunit;

public sealed class DigestSourceTests
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 6, 12, 0, 0, TimeSpan.Zero);

    private static readonly DateOnly Day = new(2026, 9, 6);

    private readonly FakeLogStore logs = new();
    private readonly FakeUsageStore usage = new();

    [Fact]
    public async Task ReadsTheEntriesAndTheDayTogether()
    {
        this.logs.Seed(Day, Note("one"));
        this.usage.Seed(Day, Counted(views: 12));

        DigestWindow window = await this.Source().ReadAsync(Day, CancellationToken.None);

        Assert.Equal(Day, window.Day);
        Assert.Single(window.Entries);
        Assert.Contains(window.OpeningFacts, fact => fact.Label == "Views" && fact.Value == "12");
    }

    /// <summary>What the buffer lost is stored beside the entries, so the digest still says so.</summary>
    [Fact]
    public async Task CarriesWhatTheBufferCouldNotHold()
    {
        await this.logs.AppendAsync(Day, [Note("one")], 3, CancellationToken.None);

        DigestWindow window = await this.Source().ReadAsync(Day, CancellationToken.None);

        Assert.Equal(3, window.Dropped);
    }

    /// <summary>
    /// Both halves are stored now, so a digest that failed to send has not consumed the day.
    /// </summary>
    [Fact]
    public async Task LeavesBothHalvesWhereTheyAre()
    {
        this.logs.Seed(Day, Note("one"));
        this.usage.Seed(Day, Counted(views: 3));

        await this.Source().ReadAsync(Day, CancellationToken.None);
        DigestWindow second = await this.Source().ReadAsync(Day, CancellationToken.None);

        Assert.Single(second.Entries);
        Assert.Contains(second.OpeningFacts, fact => fact.Label == "Views" && fact.Value == "3");
    }

    /// <summary>Storage being unreachable must not take the API down with it.</summary>
    [Fact]
    public async Task SaysSoWhenTheDayCannotBeRead()
    {
        this.usage.FailWith = new InvalidOperationException("storage is down");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => this.Source().ReadAsync(Day, CancellationToken.None));
    }

    [Fact]
    public async Task SaysAQuietDayIsQuiet()
    {
        Assert.False((await this.Source().ReadAsync(Day, CancellationToken.None)).HasAnything);
    }

    /// <summary>Views alone, with no log entries, is still worth a digest.</summary>
    [Fact]
    public async Task ForceSendsWhenOnlyUsageHappened()
    {
        this.usage.Seed(Day, Counted(views: 1));

        Assert.True((await this.Source().ReadAsync(Day, CancellationToken.None)).HasAnything);
    }

    /// <summary>Refused interactions are worth a figure of their own, not just a footnote.</summary>
    [Fact]
    public async Task NamesHowManyInteractionsWereRefused()
    {
        this.usage.Seed(Day, AnalyticsSummary.Of(0, [], rejected: 4));

        DigestWindow window = await this.Source().ReadAsync(Day, CancellationToken.None);

        Assert.Contains(
            window.OpeningFacts, fact => fact.Label == "Refused interactions" && fact.Value == "4");
    }

    private static AnalyticsSummary Counted(int views)
    {
        return AnalyticsSummary.Of(views, [new OperationCount(InteractionCatalogue.Route, 2)], 0);
    }

    private static LogEntry Note(string message)
    {
        return LogEntry.Note(
            Noon, LogSeverity.Warning, LogDomain.Named("Http"), "Analytics.Api.Http.Thing", message);
    }

    private DigestSource Source()
    {
        return new DigestSource(this.logs, this.usage);
    }
}
