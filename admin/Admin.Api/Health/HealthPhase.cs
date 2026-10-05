namespace Admin.Api.Health;

/// <summary>Where asking one target has got to.</summary>
public enum HealthPhase
{
    /// <summary>The request is out.</summary>
    Asking = 1,

    /// <summary>Silent long enough that it is most likely starting.</summary>
    Waking = 2,

    /// <summary>It answered, or the probe gave up on it.</summary>
    Answered = 3,
}
