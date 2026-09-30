namespace Admin.Tests.Fakes;

using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;

/// <summary>The analytics table, without one.</summary>
public sealed class FakeUsageStore : IUsageStore
{
    private readonly Dictionary<DateOnly, AnalyticsSummary> days = [];

    /// <summary>Every day it was asked about, so a test can assert the window that was read.</summary>
    public List<DateOnly> Asked { get; } = [];

    /// <summary>Puts a day in place, as though the API had counted it.</summary>
    public void Seed(DateOnly day, AnalyticsSummary counted)
    {
        this.days[day] = counted;
    }

    public Task ApplyAsync(DateOnly day, AnalyticsSummary counted, CancellationToken cancellationToken)
    {
        throw new InvalidOperationException("The admin tool reads. It must never write back.");
    }

    public Task<AnalyticsSummary> ReadAsync(DateOnly day, CancellationToken cancellationToken)
    {
        this.Asked.Add(day);

        return Task.FromResult(this.days.GetValueOrDefault(day, AnalyticsSummary.Empty));
    }
}
