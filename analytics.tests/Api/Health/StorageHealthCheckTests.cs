namespace Analytics.Tests.Api.Health;

using Analytics.Api.Health;
using Analytics.Domain.Views;
using Analytics.Tests.Fakes;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Xunit;

/// <summary>The readiness check that proves the table answers, and what it may say when it does not.</summary>
public sealed class StorageHealthCheckTests
{
    [Fact]
    public async Task IsHealthyWhenTheTableAnswers()
    {
        FakeCounterTable table = new();
        table.Seed(CounterRowKey.Partition, CounterRowKey.Total, 42);

        HealthCheckResult result = await CheckAsync(table);

        Assert.Equal(HealthStatus.Healthy, result.Status);
    }

    /// <summary>Nobody has visited yet is an answer, not a fault.</summary>
    [Fact]
    public async Task IsHealthyOnAnEmptyTable()
    {
        HealthCheckResult result = await CheckAsync(new FakeCounterTable());

        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Contains("no views yet", result.Description ?? string.Empty, StringComparison.Ordinal);
    }

    [Fact]
    public async Task IsUnhealthyWhenTheTableCannotBeReached()
    {
        FakeCounterTable table = new() { ReadFailure = new TimeoutException("no route to storage") };

        HealthCheckResult result = await CheckAsync(table);

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
    }

    /// <summary>Only the exception's type may appear, because this body is served to whoever asks.</summary>
    [Fact]
    public async Task SaysWhatFailedWithoutRepeatingWhatTheClientSaid()
    {
        FakeCounterTable table = new()
        {
            ReadFailure = new TimeoutException("https://secret.table.core.windows.net?sig=abc"),
        };

        HealthCheckResult result = await CheckAsync(table);

        string note = result.Description ?? string.Empty;

        Assert.Contains(nameof(TimeoutException), note, StringComparison.Ordinal);
        Assert.DoesNotContain("sig=", note, StringComparison.Ordinal);
        Assert.Null(result.Exception);
    }

    /// <summary>A shutdown mid-probe is the host stopping, not storage failing.</summary>
    [Fact]
    public async Task LetsCancellationThrough()
    {
        FakeCounterTable table = new() { ReadFailure = new OperationCanceledException() };

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => CheckAsync(table));
    }

    /// <summary>One point read, not a listing: this runs on a probe's schedule and costs money.</summary>
    [Fact]
    public async Task ReadsOneRowAndNothingElse()
    {
        FakeCounterTable table = new();

        await CheckAsync(table);

        Assert.Equal([(CounterRowKey.Partition, CounterRowKey.Total)], table.Reads);
        Assert.Equal(0, table.Listings);
    }

    private static Task<HealthCheckResult> CheckAsync(FakeCounterTable table)
    {
        return new StorageHealthCheck(table).CheckHealthAsync(
            new HealthCheckContext(), CancellationToken.None);
    }
}
