namespace Analytics.Tests.Fakes;

using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;

/// <summary>In-memory durable side, so the buffer can be tested without a table.</summary>
public sealed class FakeViewAccumulator : IViewAccumulator
{
    private readonly Dictionary<string, long> stored = new(StringComparer.Ordinal);

    /// <summary>When set, a read takes its answer and waits here, which is the half of the race tests cannot arrange.</summary>
    private TaskCompletionSource? paused;

    /// <summary>Whether the next read is the one that pauses. Only ever one is.</summary>
    private bool armed;

    /// <summary>Every batch handed to it, in order, so a test can assert what was written.</summary>
    public List<IReadOnlyDictionary<string, long>> Batches { get; } = [];

    /// <summary>When set, the next apply throws it instead of storing anything.</summary>
    public Exception? FailWith { get; set; }

    /// <summary>Completed once a paused read has taken its answer from the store.</summary>
    public TaskCompletionSource ReadStarted { get; } = new();

    /// <summary>Makes the next read pause after it has taken its answer.</summary>
    public void PauseNextRead()
    {
        this.paused = new TaskCompletionSource();
        this.armed = true;
    }

    /// <summary>Lets a paused read return.</summary>
    public void ReleaseRead()
    {
        this.paused?.TrySetResult();
    }

    public Task ApplyAsync(IReadOnlyDictionary<string, long> deltas, CancellationToken cancellationToken)
    {
        if (this.FailWith is not null)
        {
            Exception failure = this.FailWith;
            this.FailWith = null;
            throw failure;
        }

        this.Batches.Add(deltas);
        foreach (KeyValuePair<string, long> delta in deltas)
        {
            this.stored[delta.Key] = this.stored.GetValueOrDefault(delta.Key) + delta.Value;
        }

        return Task.CompletedTask;
    }

    public async Task<ViewStats> ReadAsync(CancellationToken cancellationToken)
    {
        List<CountryCount> countries =
        [
            .. this.stored
                .Select(entry => new CountryCount(entry.Key, entry.Value))
                .OrderByDescending(country => country.Count),
        ];

        ViewStats answer = new(countries.Sum(country => country.Count), countries);

        // Disarm rather than clear: the field is what ReleaseRead completes, so dropping it
        // here would leave the read waiting on a source nothing can reach.
        if (this.armed && this.paused is TaskCompletionSource pause)
        {
            this.armed = false;
            this.ReadStarted.TrySetResult();
            await pause.Task;
        }

        return answer;
    }
}
