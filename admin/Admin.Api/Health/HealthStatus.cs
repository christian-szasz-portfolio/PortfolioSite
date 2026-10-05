namespace Admin.Api.Health;

/// <summary>What a target or one of its checks says about itself.</summary>
public enum HealthStatus
{
    /// <summary>Not asked, or not reached.</summary>
    Unknown = 1,

    /// <summary>Answering and fine.</summary>
    Healthy = 2,

    /// <summary>Answering, with something to look at.</summary>
    Degraded = 3,

    /// <summary>Answering that it is broken.</summary>
    Unhealthy = 4,
}
