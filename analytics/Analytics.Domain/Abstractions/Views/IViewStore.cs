namespace Analytics.Domain.Abstractions.Views;

using Analytics.Domain.Models;

/// <summary>Records views and reads the running totals.</summary>
public interface IViewStore
{
    /// <summary>Records one view from a country and returns the updated stats.</summary>
    Task<ViewStats> RecordAsync(string country, CancellationToken cancellationToken);

    /// <summary>Reads the current stats without recording anything.</summary>
    Task<ViewStats> ReadAsync(CancellationToken cancellationToken);
}
