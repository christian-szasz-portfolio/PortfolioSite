namespace Analytics.Tests.Domain.Usage.Models;

using Analytics.Domain.Usage.Models;
using Xunit;

public sealed class InteractionKindTests
{
    [Theory]
    [InlineData("route")]
    [InlineData("cv.download.pdf")]
    [InlineData("project-read")]
    [InlineData("a1")]
    public void AcceptsAWireNameMadeOfWhatAWireNameIsMadeOf(string name)
    {
        Assert.Equal(name, InteractionKind.Named(name, "Label", 10).Name);
    }

    // The name travels in a request body and ends up in an email. Nothing that could be markup,
    // whitespace or an encoding trick is allowed to be a name in the first place.
    [Theory]
    [InlineData("Route")]
    [InlineData("cv download")]
    [InlineData("cv/download")]
    [InlineData("<script>")]
    [InlineData("route!")]
    [InlineData("routé")]
    public void RefusesAnythingElse(string name)
    {
        Assert.Throws<ArgumentException>(() => InteractionKind.Named(name, "Label", 10));
    }

    [Fact]
    public void RefusesANameLongerThanItSaysItAllows()
    {
        string overlong = new('a', InteractionKind.MaxNameLength + 1);

        Assert.Throws<ArgumentException>(() => InteractionKind.Named(overlong, "Label", 10));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void RefusesAnEmptyName(string name)
    {
        Assert.Throws<ArgumentException>(() => InteractionKind.Named(name, "Label", 10));
    }

    [Fact]
    public void RefusesAKindWithNothingToCallIt()
    {
        Assert.Throws<ArgumentException>(() => InteractionKind.Named("route", "  ", 10));
    }

    // The tally keys on the kind, so two of them for the same operation must be the same key.
    [Fact]
    public void IsTheSameKindWhenTheWireNameIsTheSame()
    {
        InteractionKind one = InteractionKind.Named("route", "Page opened", 10);
        InteractionKind other = InteractionKind.Named("route", "Something else", 99);

        Assert.Equal(one, other);
        Assert.Equal(one.GetHashCode(), other.GetHashCode());
    }
}
