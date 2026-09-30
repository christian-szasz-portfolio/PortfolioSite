namespace Admin.Api.Health;

/// <summary>Asks the analytics API how it is, on demand.</summary>
/// <remarks>On demand rather than polled, because asking a sleeping host wakes it.</remarks>
public interface IAnalyticsHealth
{
    /// <summary>Reads its readiness, or says why it could not be reached.</summary>
    Task<AnalyticsHealth> ReadAsync(CancellationToken cancellationToken);
}
