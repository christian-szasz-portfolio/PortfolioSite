namespace Analytics.Domain.Resilience;

using Analytics.Domain.Abstractions.Resilience;
using Analytics.Domain.Abstractions.Storage;

/// <summary>Retries a lost race a fixed number of times before giving up.</summary>
public sealed class ConcurrencyRetryPolicy(int maxAttempts) : IRetryPolicy
{
    private readonly int maxAttempts = maxAttempts > 0
        ? maxAttempts
        : throw new ArgumentOutOfRangeException(nameof(maxAttempts), "At least one attempt is needed.");

    public async Task ExecuteAsync(
        Func<CancellationToken, Task> operation,
        string description,
        CancellationToken cancellationToken)
    {
        for (int attempt = 1; attempt <= this.maxAttempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                await operation(cancellationToken);
                return;
            }
            catch (ConcurrencyException)
            {
                // Another writer got there first: run the whole attempt again, then give up below.
            }
        }

        throw new ConcurrencyException($"Gave up {description} after {this.maxAttempts} attempts.");
    }
}
