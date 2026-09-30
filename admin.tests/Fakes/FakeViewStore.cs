namespace Admin.Tests.Fakes;

using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;

/// <summary>The view counter, without a table behind it.</summary>
public sealed class FakeViewStore : IViewStore
{
    /// <summary>What the counter says when it is read.</summary>
    public long Total { get; set; } = 46;

    public Task<ViewStats> RecordAsync(string country, CancellationToken cancellationToken)
    {
        throw new InvalidOperationException("The admin tool reads. It must never record a view.");
    }

    public Task<ViewStats> ReadAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult(new ViewStats(
            this.Total, [new CountryCount("RO", this.Total)]));
    }
}
