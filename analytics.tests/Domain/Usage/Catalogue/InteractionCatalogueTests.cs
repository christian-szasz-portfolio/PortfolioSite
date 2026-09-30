namespace Analytics.Tests.Domain.Usage.Catalogue;

using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Xunit;

public sealed class InteractionCatalogueTests
{
    private readonly InteractionCatalogue catalogue = new();

    [Fact]
    public void ResolvesEverythingItSaysItCounts()
    {
        foreach (InteractionKind kind in this.catalogue.Kinds)
        {
            Assert.Equal(kind, this.catalogue.Resolve(kind.Name));
        }
    }

    // The allowlist. A name that does not resolve is counted as a refusal and goes no further,
    // which is what keeps an unbounded set of names out of the tally.
    [Theory]
    [InlineData("nope")]
    [InlineData("ROUTE")]
    [InlineData("route ")]
    [InlineData("")]
    [InlineData(null)]
    public void ResolvesNothingElse(string? name)
    {
        Assert.Null(this.catalogue.Resolve(name));
    }

    [Fact]
    public void CoversEveryStepThePageWasAskedToReport()
    {
        Assert.Equal(
            ["route", "section", "cv.open", "cv.download.pdf", "cv.download.source", "project.read"],
            this.catalogue.Kinds.Select(kind => kind.Name));
    }

    // Two kinds under one name would shadow each other and be reported as one operation. It is
    // built once at startup, so this stops the host then rather than producing a wrong number
    // every day afterwards.
    [Fact]
    public void RefusesToBeBuiltWithTwoKindsUnderOneName()
    {
        InteractionKind one = InteractionKind.Named("route", "Page opened", 10);
        InteractionKind other = InteractionKind.Named("route", "Something else", 20);

        DuplicateInteractionKindException thrown =
            Assert.Throws<DuplicateInteractionKindException>(() => new InteractionCatalogue([one, other]));

        Assert.Equal("route", thrown.Name);
    }

    [Fact]
    public void ListsWhatItCountsInTheOrderTheDigestShouldPrintIt()
    {
        InteractionKind last = InteractionKind.Named("last", "Last", 99);
        InteractionKind first = InteractionKind.Named("first", "First", 1);

        InteractionCatalogue ordered = new([last, first]);

        Assert.Equal([first, last], ordered.Kinds);
    }
}
