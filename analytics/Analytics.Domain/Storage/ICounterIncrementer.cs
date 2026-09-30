namespace Analytics.Domain.Storage;

/// <summary>Adds to a stored counter, however many attempts that takes.</summary>
public interface ICounterIncrementer
{
    /// <summary>Adds <paramref name="amount"/> to one row, creating it when it is not there yet.</summary>
    Task IncrementAsync(
        string partition, string rowKey, long amount, CancellationToken cancellationToken);
}
