namespace Analytics.Tests.Fakes;

using Common.Diagnostics.Delivery;

/// <summary>Records which days were asked for, and answers whatever a test wants.</summary>
public sealed class FakeDigestDispatcher : IDigestDispatcher
{
    /// <summary>The days it was asked to send, in order.</summary>
    public List<DateOnly> Asked { get; } = [];

    /// <summary>What it answers.</summary>
    public DigestOutcome Outcome { get; set; } = DigestOutcome.Sent;

    public Task<DigestOutcome> SendAsync(DateOnly day, CancellationToken cancellationToken)
    {
        this.Asked.Add(day);

        return Task.FromResult(this.Outcome);
    }
}
