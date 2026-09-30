namespace Analytics.Tests.Fakes;

using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Models;

/// <summary>A log store with nothing behind it, kept as one list per day.</summary>
public sealed class FakeLogStore : ILogStore
{
    private readonly Dictionary<DateOnly, List<LogEntry>> days = [];
    private readonly Dictionary<DateOnly, int> losses = [];

    /// <summary>Thrown by every call, for the callers that have to cope with a failed write.</summary>
    public Exception? FailWith { get; set; }

    /// <summary>Completes on the first append, for a test that must not race a worker's thread.</summary>
    public TaskCompletionSource Appended { get; } = new();

    /// <summary>Puts entries in place, as though a flush had written them.</summary>
    public void Seed(DateOnly day, params LogEntry[] entries)
    {
        this.Entries(day).AddRange(entries);
    }

    /// <summary>What one day holds now.</summary>
    public IReadOnlyList<LogEntry> Stored(DateOnly day)
    {
        return this.days.TryGetValue(day, out List<LogEntry>? entries) ? entries : [];
    }

    public Task AppendAsync(
        DateOnly day,
        IReadOnlyList<LogEntry> entries,
        int dropped,
        CancellationToken cancellationToken)
    {
        try
        {
            if (this.FailWith is { } failure)
            {
                throw failure;
            }

            this.Entries(day).AddRange(entries);
            this.losses[day] = this.Dropped(day) + dropped;

            return Task.CompletedTask;
        }
        finally
        {
            this.Appended.TrySetResult();
        }
    }

    public Task<StoredLog> ReadAsync(DateOnly day, CancellationToken cancellationToken)
    {
        if (this.FailWith is { } failure)
        {
            throw failure;
        }

        return Task.FromResult(new StoredLog(this.Stored(day), this.Dropped(day)));
    }

    private int Dropped(DateOnly day)
    {
        return this.losses.TryGetValue(day, out int dropped) ? dropped : 0;
    }

    private List<LogEntry> Entries(DateOnly day)
    {
        if (!this.days.TryGetValue(day, out List<LogEntry>? entries))
        {
            entries = [];
            this.days[day] = entries;
        }

        return entries;
    }
}
