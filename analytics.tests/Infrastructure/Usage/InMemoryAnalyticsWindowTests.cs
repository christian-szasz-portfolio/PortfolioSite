namespace Analytics.Tests.Infrastructure.Usage;

using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Infrastructure.Usage;
using Xunit;

public sealed class InMemoryAnalyticsWindowTests
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 6, 12, 0, 0, TimeSpan.Zero);

    private readonly InMemoryAnalyticsWindow window = new();

    [Fact]
    public void CountsViewsAndInteractionsSeparately()
    {
        this.window.RecordView();
        this.window.RecordView();
        this.window.RecordInteraction(Interaction.Of(InteractionCatalogue.Route, "/cv", Noon));

        AnalyticsSummary summary = this.window.Take();

        Assert.Equal(2, summary.Views);
        Assert.Equal(1, summary.Interactions);
    }

    [Fact]
    public void GroupsInteractionsByWhatWasDoneRatherThanWhatItWasDoneTo()
    {
        this.window.RecordInteraction(Interaction.Of(InteractionCatalogue.ProjectRead, "stack86", Noon));
        this.window.RecordInteraction(Interaction.Of(InteractionCatalogue.ProjectRead, "taskly", Noon));

        OperationCount counted = Assert.Single(this.window.Take().Operations);

        Assert.Equal(InteractionCatalogue.ProjectRead, counted.Kind);
        Assert.Equal(2, counted.Count);
    }

    // Each digest reports its own window. Taking twice must not report the same use twice.
    [Fact]
    public void EmptiesItselfWhenItIsTaken()
    {
        this.window.RecordView();
        this.window.RecordInteraction(Interaction.Of(InteractionCatalogue.CvPdf, null, Noon));
        this.window.RecordRejection();

        this.window.Take();

        Assert.False(this.window.Take().HasAnything);
    }

    [Fact]
    public void CountsARefusalWithoutKeepingWhatItSaid()
    {
        this.window.RecordRejection();
        this.window.RecordRejection();

        AnalyticsSummary summary = this.window.Take();

        Assert.Equal(2, summary.Rejected);
        Assert.Empty(summary.Operations);
    }

    [Fact]
    public void IgnoresAnInteractionThatIsNotThere()
    {
        this.window.RecordInteraction(null!);

        Assert.False(this.window.Take().HasAnything);
    }

    // It is written from every request thread at once. A lost count here would be invisible:
    // the number would simply be a little low, every day, with nothing to notice.
    [Fact]
    public void LosesNothingWhenEveryThreadCountsAtOnce()
    {
        const int Threads = 8;
        const int Each = 500;

        Parallel.For(0, Threads, _ =>
        {
            for (int index = 0; index < Each; index++)
            {
                this.window.RecordView();
                this.window.RecordInteraction(Interaction.Of(InteractionCatalogue.Section, "work", Noon));
            }
        });

        AnalyticsSummary summary = this.window.Take();

        Assert.Equal(Threads * Each, summary.Views);
        Assert.Equal(Threads * Each, summary.Interactions);
    }
}
