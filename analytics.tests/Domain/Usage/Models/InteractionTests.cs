namespace Analytics.Tests.Domain.Usage.Models;

using Analytics.Domain.Usage.Models;
using Xunit;

public sealed class InteractionTests
{
    private static readonly InteractionKind Route = InteractionKind.Named("route", "Page opened", 10);

    private static readonly DateTimeOffset Noon = new(2026, 9, 6, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void KeepsAnOrdinaryTargetAsItIs()
    {
        Assert.Equal("/work/stack86", Interaction.Of(Route, "/work/stack86", Noon).Target);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void HasNoTargetWhenItWasGivenNone(string? target)
    {
        Assert.Equal(string.Empty, Interaction.Of(Route, target, Noon).Target);
    }

    [Fact]
    public void TrimsWhatThePageSent()
    {
        Assert.Equal("/cv", Interaction.Of(Route, "  /cv  ", Noon).Target);
    }

    // A target arrives from the page, so a long one is cut rather than kept. Counting the
    // interaction matters; keeping every character of what it pointed at does not.
    [Fact]
    public void CutsATargetLongerThanItKeeps()
    {
        string overlong = new('a', Interaction.MaxTargetLength * 3);

        Assert.Equal(Interaction.MaxTargetLength, Interaction.Of(Route, overlong, Noon).Target.Length);
    }

    // Not about markup, which the HTML builder escapes on its way out. This is about a newline
    // splitting one log line into two, and about a null reaching something that formats it.
    [Fact]
    public void StripsControlCharacters()
    {
        string hostile = "/cv" + (char)13 + (char)10 + "Injected: header";

        Interaction interaction = Interaction.Of(Route, hostile, Noon);

        Assert.Equal("/cvInjected: header", interaction.Target);
    }

    [Fact]
    public void RefusesToBeBuiltWithoutAKind()
    {
        Assert.Throws<ArgumentNullException>(() => Interaction.Of(null!, "/cv", Noon));
    }
}
