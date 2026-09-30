namespace Analytics.Tests.Domain.Resilience;

using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Resilience;
using Xunit;

public sealed class ConcurrencyRetryPolicyTests
{
    [Fact]
    public async Task RunsTheOperationOnceWhenItWins()
    {
        int attempts = 0;
        ConcurrencyRetryPolicy policy = new(5);

        await policy.ExecuteAsync(
            _ =>
            {
                attempts++;
                return Task.CompletedTask;
            },
            "counting",
            CancellationToken.None);

        Assert.Equal(1, attempts);
    }

    [Fact]
    public async Task RunsTheWholeOperationAgainAfterALostRace()
    {
        int attempts = 0;
        ConcurrencyRetryPolicy policy = new(5);

        await policy.ExecuteAsync(
            _ =>
            {
                attempts++;
                if (attempts < 3)
                {
                    throw new ConcurrencyException("lost");
                }

                return Task.CompletedTask;
            },
            "counting",
            CancellationToken.None);

        Assert.Equal(3, attempts);
    }

    [Fact]
    public async Task GivesUpAfterTheAllowedAttemptsAndNamesTheOperation()
    {
        int attempts = 0;
        ConcurrencyRetryPolicy policy = new(4);

        ConcurrencyException failure = await Assert.ThrowsAsync<ConcurrencyException>(
            () => policy.ExecuteAsync(
                _ =>
                {
                    attempts++;
                    throw new ConcurrencyException("lost");
                },
                "incrementing 'C_RO'",
                CancellationToken.None));

        Assert.Equal(4, attempts);
        Assert.Equal("Gave up incrementing 'C_RO' after 4 attempts.", failure.Message);
    }

    // Anything other than a lost race is a real fault and must not be retried away.
    [Fact]
    public async Task DoesNotRetryAnUnrelatedFailure()
    {
        int attempts = 0;
        ConcurrencyRetryPolicy policy = new(5);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => policy.ExecuteAsync(
                _ =>
                {
                    attempts++;
                    throw new InvalidOperationException("storage is down");
                },
                "counting",
                CancellationToken.None));

        Assert.Equal(1, attempts);
    }

    [Fact]
    public async Task StopsWhenCancelled()
    {
        using CancellationTokenSource cancelled = new();
        await cancelled.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new ConcurrencyRetryPolicy(5).ExecuteAsync(_ => Task.CompletedTask, "counting", cancelled.Token));
    }

    [Fact]
    public void RefusesAPolicyThatWouldNeverRun()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new ConcurrencyRetryPolicy(0));
    }
}
