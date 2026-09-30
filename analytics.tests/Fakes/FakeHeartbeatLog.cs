namespace Analytics.Tests.Fakes;

using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Models;

/// <summary>Records every beat, so a test can say a worker reported rather than assume it.</summary>
internal sealed class FakeHeartbeatLog : IHeartbeatLog
{
    private readonly List<Heartbeat> beats = [];

    private readonly TaskCompletionSource<Heartbeat> first = new();

    /// <summary>Every beat in the order it arrived, latest last.</summary>
    public IReadOnlyList<Heartbeat> Beats => this.Latest();

    /// <summary>Completes on the first beat, since a worker reports from its own thread.</summary>
    public Task<Heartbeat> FirstBeat => this.first.Task;

    /// <summary>How many times one worker has reported.</summary>
    public int CountFor(string worker) => this.Latest().Count(beat => beat.Worker == worker);

    public void Beat(string worker, TimeSpan period)
    {
        Heartbeat beat = new(worker, DateTimeOffset.UnixEpoch, period);

        lock (this.beats)
        {
            this.beats.Add(beat);
        }

        this.first.TrySetResult(beat);
    }

    public IReadOnlyList<Heartbeat> Latest()
    {
        lock (this.beats)
        {
            return [.. this.beats];
        }
    }
}
