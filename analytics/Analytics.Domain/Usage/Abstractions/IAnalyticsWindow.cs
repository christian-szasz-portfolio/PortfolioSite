namespace Analytics.Domain.Usage.Abstractions;

using Analytics.Domain.Usage.Models;

/// <summary>What has been counted since the last flush took it.</summary>
public interface IAnalyticsWindow
{
    /// <summary>Takes everything counted so far, leaving the window empty.</summary>
    AnalyticsSummary Take();

    /// <summary>Puts a taken window back after a failed write, adding to what was counted since.</summary>
    void Restore(AnalyticsSummary taken);
}
