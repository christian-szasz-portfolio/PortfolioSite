namespace Analytics.Domain.Usage.Abstractions;

using Analytics.Domain.Usage.Models;

/// <summary>Where a day of usage is kept, so it outlives the process that counted it.</summary>
/// <remarks>The in-memory window buffers in front of it, so a request never waits on storage.</remarks>
public interface IUsageStore
{
    /// <summary>Adds a flushed window to a day's rows.</summary>
    Task ApplyAsync(DateOnly day, AnalyticsSummary counted, CancellationToken cancellationToken);

    /// <summary>Everything counted on one day, or an empty summary when nothing was.</summary>
    Task<AnalyticsSummary> ReadAsync(DateOnly day, CancellationToken cancellationToken);
}
