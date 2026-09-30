namespace Analytics.Domain.Abstractions.Storage;

/// <summary>Thrown when an optimistic-concurrency write loses a race and should be retried.</summary>
public sealed class ConcurrencyException(string message) : Exception(message)
{
}
