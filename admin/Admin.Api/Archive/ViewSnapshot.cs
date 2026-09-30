namespace Admin.Api.Archive;

/// <summary>The view counter as it stood when a sync took it.</summary>
/// <param name="Day">The day the snapshot was taken, in UTC, which is also the file name.</param>
/// <param name="TakenAt">When exactly, so two snapshots on one day are distinguishable.</param>
/// <param name="Total">Every counted view, across all countries, since the counter began.</param>
/// <param name="Countries">Per-country tallies, most viewed first.</param>
/// <remarks>Archived because a running total only becomes a rate when there are two of them.</remarks>
public sealed record ViewSnapshot(
    DateOnly Day,
    DateTimeOffset TakenAt,
    long Total,
    IReadOnlyList<ViewCountry> Countries);
