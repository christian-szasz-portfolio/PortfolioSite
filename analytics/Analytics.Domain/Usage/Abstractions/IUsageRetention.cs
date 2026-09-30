namespace Analytics.Domain.Usage.Abstractions;

/// <summary>Removes days of usage that are older than the site says it keeps.</summary>
public interface IUsageRetention
{
    /// <summary>Drops every stored day before <paramref name="oldestKept"/>, and answers how many went.</summary>
    Task<int> DropBeforeAsync(DateOnly oldestKept, CancellationToken cancellationToken);
}
