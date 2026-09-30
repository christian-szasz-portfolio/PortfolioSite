namespace Admin.Api.Sync;

/// <summary>What one sync did.</summary>
/// <param name="From">The oldest day it asked for.</param>
/// <param name="To">The newest day it asked for.</param>
/// <param name="DaysArchived">How many of those days had anything in them and were written.</param>
/// <param name="ViewsTotal">The counter's running total at the moment it looked.</param>
/// <param name="Location">Where the files are, so the answer says it rather than the reader guessing.</param>
public sealed record SyncReport(
    DateOnly From,
    DateOnly To,
    int DaysArchived,
    long ViewsTotal,
    string Location);
