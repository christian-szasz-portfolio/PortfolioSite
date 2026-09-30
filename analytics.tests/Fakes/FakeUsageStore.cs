namespace Analytics.Tests.Fakes;

using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;

/// <summary>A usage store with nothing behind it, so a test needs no table.</summary>
public sealed class FakeUsageStore : IUsageStore
{
    private readonly Dictionary<DateOnly, AnalyticsSummary> days = [];

    /// <summary>Every day written to, in order, so a test can assert what was flushed where.</summary>
    public List<(DateOnly Day, AnalyticsSummary Counted)> Applied { get; } = [];

    /// <summary>When set, the next apply or read throws it instead of doing anything.</summary>
    public Exception? FailWith { get; set; }

    /// <summary>Puts a day in place, as though an earlier flush had stored it.</summary>
    public void Seed(DateOnly day, AnalyticsSummary counted)
    {
        this.days[day] = counted;
    }

    public Task ApplyAsync(DateOnly day, AnalyticsSummary counted, CancellationToken cancellationToken)
    {
        if (this.FailWith is { } failure)
        {
            throw failure;
        }

        this.Applied.Add((day, counted));
        this.days[day] = counted;

        return Task.CompletedTask;
    }

    public Task<AnalyticsSummary> ReadAsync(DateOnly day, CancellationToken cancellationToken)
    {
        if (this.FailWith is { } failure)
        {
            throw failure;
        }

        return Task.FromResult(this.days.GetValueOrDefault(day, AnalyticsSummary.Empty));
    }
}
