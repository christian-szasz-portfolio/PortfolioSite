namespace Analytics.Domain.Abstractions.Resilience;

/// <summary>How an optimistic-concurrency write is retried when it loses a race.</summary>
public interface IRetryPolicy
{
    /// <summary>Repeats the operation while it loses a race, then throws <see cref="ConcurrencyException"/>.</summary>
    /// <param name="operation">The whole read-modify-write attempt, run afresh each time.</param>
    /// <param name="description">What is being attempted, for the message if it gives up.</param>
    /// <param name="cancellationToken">Cancels between and during attempts.</param>
    Task ExecuteAsync(
        Func<CancellationToken, Task> operation,
        string description,
        CancellationToken cancellationToken);
}
