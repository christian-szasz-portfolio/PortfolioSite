namespace Admin.Api.Health;

/// <summary>Asks a deployed service how it is, on demand.</summary>
/// <remarks>On demand rather than polled, because asking a sleeping host wakes it.</remarks>
public interface IHealthProbe
{
    /// <summary>Reads the target's readiness, or says why it could not be reached.</summary>
    Task<TargetHealth> ReadAsync(HealthTarget target, CancellationToken cancellationToken);
}
