namespace Admin.Api.Health;

/// <summary>One step in asking one target, as the stream sends it.</summary>
/// <param name="Target">Which service this is about.</param>
/// <param name="Phase">How far asking it has got.</param>
/// <param name="Health">Its answer once <paramref name="Phase"/> is Answered, otherwise <c>null</c>.</param>
public sealed record HealthEvent(HealthTarget Target, HealthPhase Phase, TargetHealth? Health);
