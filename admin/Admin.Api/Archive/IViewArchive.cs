namespace Admin.Api.Archive;

/// <summary>Snapshots of the view counter, kept on this machine.</summary>
public interface IViewArchive
{
    /// <summary>Writes one snapshot, replacing an earlier one taken the same day.</summary>
    Task SaveAsync(ViewSnapshot snapshot, CancellationToken cancellationToken);

    /// <summary>Every snapshot held, oldest first.</summary>
    Task<IReadOnlyList<ViewSnapshot>> ReadAllAsync(CancellationToken cancellationToken);

    /// <summary>The most recent snapshot, or null before the first sync.</summary>
    Task<ViewSnapshot?> LatestAsync(CancellationToken cancellationToken);
}
