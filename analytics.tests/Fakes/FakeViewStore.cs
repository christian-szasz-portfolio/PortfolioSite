namespace Analytics.Tests.Fakes;

using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;

/// <summary>A counter with nothing behind it, so a pipeline test needs no table.</summary>
public sealed class FakeViewStore : IViewStore
{
    /// <summary>Every country recorded, in order.</summary>
    public List<string> Recorded { get; } = [];

    public Task<ViewStats> RecordAsync(string country, CancellationToken cancellationToken)
    {
        this.Recorded.Add(country);

        return Task.FromResult(new ViewStats(this.Recorded.Count, []));
    }

    public Task<ViewStats> ReadAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult(new ViewStats(this.Recorded.Count, []));
    }
}
