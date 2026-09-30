namespace Analytics.Domain.Abstractions.Views;

using Analytics.Domain.Models;

/// <summary>Applies whole batches of counted views at once.</summary>
public interface IViewAccumulator
{
    /// <summary>Adds the given per-country deltas to the stored tallies.</summary>
    Task ApplyAsync(IReadOnlyDictionary<string, long> deltas, CancellationToken cancellationToken);

    /// <summary>Reads what is stored, without anything still buffered elsewhere.</summary>
    Task<ViewStats> ReadAsync(CancellationToken cancellationToken);
}
