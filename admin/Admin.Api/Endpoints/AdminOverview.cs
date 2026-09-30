namespace Admin.Api.Endpoints;

using Admin.Api.Archive;

/// <summary>Everything the dashboard draws, in one answer.</summary>
/// <param name="ArchiveLocation">Where the files are on this machine.</param>
/// <param name="Source">Which storage the archive was synced from, in words.</param>
/// <param name="IsLive">False when that storage is the local emulator.</param>
/// <param name="Days">Every archived day, oldest first.</param>
/// <param name="Operations">Each operation totalled across those days, most used first.</param>
/// <param name="ArchivedViews">Views summed over the archived days, which is a rate, not a total.</param>
/// <param name="ArchivedInteractions">Interactions summed the same way.</param>
/// <param name="Views">The most recent view-counter snapshot, or null before the first sync.</param>
/// <remarks>One call rather than four, because the dashboard draws a fixed set of things.</remarks>
public sealed record AdminOverview(
    string ArchiveLocation,
    string Source,
    bool IsLive,
    IReadOnlyList<UsageDay> Days,
    IReadOnlyList<UsageOperation> Operations,
    int ArchivedViews,
    int ArchivedInteractions,
    ViewSnapshot? Views);
