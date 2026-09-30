namespace Admin.Api.Health;

/// <summary>What the analytics API says about itself, as the dashboard shows it.</summary>
/// <param name="Reachable">False when the API could not be asked at all.</param>
/// <param name="Problem">Why it could not be asked, in words, or <c>null</c>.</param>
/// <param name="Status">Healthy, Degraded or Unhealthy, and Unknown when it was not reached.</param>
/// <param name="Checks">Each check it ran, by name.</param>
/// <param name="Workers">Each background worker that has reported.</param>
/// <remarks>Unreachable is an answer here, not a failure: the API sleeps, and saying so is the point.</remarks>
public sealed record AnalyticsHealth(
    bool Reachable,
    string? Problem,
    string Status,
    IReadOnlyList<HealthLine> Checks,
    IReadOnlyList<WorkerLine> Workers)
{
    /// <summary>What is shown when the API could not be asked.</summary>
    public static AnalyticsHealth Unreachable(string problem)
    {
        return new AnalyticsHealth(false, problem, "Unknown", [], []);
    }
}
