namespace Admin.Api.Sync;

/// <summary>Pulls what the API has into the archive on this machine.</summary>
/// <remarks>One direction only: the tool reads the counter and never writes back to it.</remarks>
public interface IAnalyticsSync
{
    /// <summary>Fetches the last <paramref name="days"/> days and archives what it finds.</summary>
    Task<SyncReport> SyncAsync(int days, CancellationToken cancellationToken);
}
