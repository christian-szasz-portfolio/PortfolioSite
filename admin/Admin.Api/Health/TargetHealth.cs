namespace Admin.Api.Health;

/// <summary>What one target says about itself, as the dashboard shows it.</summary>
/// <param name="Target">Which service answered.</param>
/// <param name="Reachable">False when it could not be asked at all.</param>
/// <param name="Problem">Why it could not be asked, in words, or <c>null</c>.</param>
/// <param name="Status">Its overall status, Unknown when it was not reached.</param>
/// <param name="Ms">How long the round trip took, which shows a cold start.</param>
/// <param name="Checks">Each check it ran, by name.</param>
/// <param name="Workers">Each background worker that has reported.</param>
/// <remarks>Unreachable is an answer here, not a failure: the services sleep.</remarks>
public sealed record TargetHealth(
    HealthTarget Target,
    bool Reachable,
    string? Problem,
    HealthStatus Status,
    long Ms,
    IReadOnlyList<HealthLine> Checks,
    IReadOnlyList<WorkerLine> Workers)
{
    /// <summary>What is shown when the target could not be asked.</summary>
    public static TargetHealth Unreachable(HealthTarget target, string problem, long ms = 0)
    {
        return new TargetHealth(target, false, problem, HealthStatus.Unknown, ms, [], []);
    }
}
