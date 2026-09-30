namespace Analytics.Tests.Domain.Usage.Models;

using Analytics.Domain.Usage.Models;
using Xunit;

public sealed class AnalyticsSummaryTests
{
    private static readonly InteractionKind Route = InteractionKind.Named("route", "Page opened", 10);
    private static readonly InteractionKind Section = InteractionKind.Named("section", "Section reached", 20);
    private static readonly InteractionKind Cv = InteractionKind.Named("cv.open", "CV opened", 30);

    [Fact]
    public void SaysNothingHappenedWhenNothingDid()
    {
        Assert.False(AnalyticsSummary.Empty.HasAnything);
        Assert.Equal(0, AnalyticsSummary.Empty.Interactions);
    }

    [Fact]
    public void CountsEveryOperationTowardsTheTotal()
    {
        AnalyticsSummary summary = AnalyticsSummary.Of(
            5, [new OperationCount(Route, 3), new OperationCount(Cv, 2)], 0);

        Assert.Equal(5, summary.Views);
        Assert.Equal(5, summary.Interactions);
    }

    // The email reads as a list, so the most used operation is the one worth reading first.
    [Fact]
    public void ListsTheMostUsedOperationFirst()
    {
        AnalyticsSummary summary = AnalyticsSummary.Of(
            0,
            [new OperationCount(Route, 3), new OperationCount(Section, 11), new OperationCount(Cv, 7)],
            0);

        Assert.Equal(
            [Section, Cv, Route],
            summary.Operations.Select(operation => operation.Kind));
    }

    [Fact]
    public void LeavesOutAnOperationNobodyPerformed()
    {
        AnalyticsSummary summary = AnalyticsSummary.Of(
            1, [new OperationCount(Route, 0), new OperationCount(Cv, 1)], 0);

        Assert.Equal(Cv, Assert.Single(summary.Operations).Kind);
    }

    // A window with only views in it still happened, and so does one with only refusals.
    [Theory]
    [InlineData(1, 0)]
    [InlineData(0, 1)]
    public void CountsAWindowAsUsedWhenAnythingAtAllWasCounted(int views, int rejected)
    {
        Assert.True(AnalyticsSummary.Of(views, [], rejected).HasAnything);
    }
}
