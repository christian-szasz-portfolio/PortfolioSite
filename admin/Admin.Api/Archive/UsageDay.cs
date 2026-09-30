namespace Admin.Api.Archive;

/// <summary>One archived day, as it sits on disk.</summary>
/// <param name="Day">The day, in UTC, which is also the file name.</param>
/// <param name="Views">Views counted that day.</param>
/// <param name="Interactions">Every counted interaction, whatever kind.</param>
/// <param name="Rejected">Interactions the API did not recognise.</param>
/// <param name="Operations">Each operation and its count, most used first.</param>
/// <param name="ArchivedAt">When this file was written, so a stale day is recognisable as one.</param>
/// <remarks>A shape of its own, so the archive does not dictate the domain's constructors.</remarks>
public sealed record UsageDay(
    DateOnly Day,
    int Views,
    int Interactions,
    int Rejected,
    IReadOnlyList<UsageOperation> Operations,
    DateTimeOffset ArchivedAt);
