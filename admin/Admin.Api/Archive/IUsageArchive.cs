namespace Admin.Api.Archive;

/// <summary>The days this machine has kept, on its own disk.</summary>
/// <remarks>The record rather than a cache: nothing in the tool ever removes from it.</remarks>
public interface IUsageArchive
{
    /// <summary>Writes one day, replacing whatever was there for it.</summary>
    Task SaveAsync(UsageDay day, CancellationToken cancellationToken);

    /// <summary>Every archived day in the range, oldest first. Missing days are simply absent.</summary>
    Task<IReadOnlyList<UsageDay>> ReadAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken);

    /// <summary>Every day held, oldest first, however far back that goes.</summary>
    Task<IReadOnlyList<UsageDay>> ReadAllAsync(CancellationToken cancellationToken);

    /// <summary>Where the files are, so the tool can say so rather than the reader guessing.</summary>
    string Location { get; }
}
