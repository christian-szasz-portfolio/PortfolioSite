namespace Analytics.Tests.Api.Health;

using Analytics.Api.Health;
using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Models;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Time.Testing;
using Xunit;

/// <summary>What the readiness probe is told about the background workers, and how loudly.</summary>
public sealed class WorkerHealthCheckTests
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 9, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeTimeProvider time = new(Noon);

    /// <summary>Before the first cycle there is nothing to report and nothing wrong.</summary>
    [Fact]
    public async Task IsHealthyBeforeAnyWorkerHasReported()
    {
        HealthCheckResult result = await CheckAsync(new StubLog(), this.time);

        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Empty(result.Data);
    }

    [Fact]
    public async Task IsHealthyWhileEveryWorkerIsWithinItsWindow()
    {
        StubLog log = new(new Heartbeat("usage-flush", Noon.AddSeconds(-4), TimeSpan.FromSeconds(5)));

        HealthCheckResult result = await CheckAsync(log, this.time);

        Assert.Equal(HealthStatus.Healthy, result.Status);
    }

    /// <summary>Degraded, not unhealthy: a stalled flush leaves the API answering.</summary>
    [Fact]
    public async Task IsDegradedRatherThanUnhealthyWhenAWorkerIsLate()
    {
        StubLog log = new(new Heartbeat("usage-flush", Noon.AddMinutes(-10), TimeSpan.FromSeconds(5)));

        HealthCheckResult result = await CheckAsync(log, this.time);

        Assert.Equal(HealthStatus.Degraded, result.Status);
        Assert.Contains("usage-flush", Note(result), StringComparison.Ordinal);
    }

    [Fact]
    public async Task NamesOnlyTheLateWorkerWhenTheOthersAreFine()
    {
        StubLog log = new(
            new Heartbeat("usage-flush", Noon.AddMinutes(-10), TimeSpan.FromSeconds(5)),
            new Heartbeat("views-flush", Noon.AddSeconds(-1), TimeSpan.FromSeconds(5)));

        HealthCheckResult result = await CheckAsync(log, this.time);

        Assert.Equal(HealthStatus.Degraded, result.Status);
        Assert.Contains("usage-flush", Note(result), StringComparison.Ordinal);
        Assert.DoesNotContain("views-flush", Note(result), StringComparison.Ordinal);
    }

    /// <summary>Numbers, so the admin dashboard reads the same payload the platform probes.</summary>
    [Fact]
    public async Task SaysHowLongAgoEachWorkerRanAndHowOften()
    {
        StubLog log = new(new Heartbeat("views-flush", Noon.AddSeconds(-12), TimeSpan.FromSeconds(5)));

        HealthCheckResult result = await CheckAsync(log, this.time);
        WorkerBeat beat = (WorkerBeat)Assert.Contains("views-flush", result.Data);

        Assert.Equal(12, beat.AgeSeconds);
        Assert.Equal(5, beat.PeriodSeconds);
        Assert.False(beat.Overdue);
    }

    [Fact]
    public async Task MarksTheLateWorkerInThePayloadToo()
    {
        StubLog log = new(new Heartbeat("log-digest", Noon.AddDays(-3), TimeSpan.FromHours(24)));

        HealthCheckResult result = await CheckAsync(log, this.time);

        Assert.True(((WorkerBeat)Assert.Contains("log-digest", result.Data)).Overdue);
    }

    private static string Note(HealthCheckResult result) => result.Description ?? string.Empty;

    private static Task<HealthCheckResult> CheckAsync(IHeartbeatLog log, TimeProvider time)
    {
        return new WorkerHealthCheck(log, time).CheckHealthAsync(
            new HealthCheckContext(), CancellationToken.None);
    }

    /// <summary>A log that reports exactly the beats a test hands it.</summary>
    private sealed class StubLog(params Heartbeat[] beats) : IHeartbeatLog
    {
        public void Beat(string worker, TimeSpan period) => throw new NotSupportedException();

        public IReadOnlyList<Heartbeat> Latest() => beats;
    }
}
