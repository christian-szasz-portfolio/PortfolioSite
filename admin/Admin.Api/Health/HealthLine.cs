namespace Admin.Api.Health;

/// <summary>One check a target ran, and what it said.</summary>
/// <param name="Name">The check's name, such as storage or workers.</param>
/// <param name="Status">What the check said.</param>
/// <param name="Note">The sentence the check left, or <c>null</c>.</param>
/// <param name="Ms">How long it took.</param>
public sealed record HealthLine(string Name, HealthStatus Status, string? Note, long Ms);
