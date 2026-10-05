namespace Admin.Api.Health;

/// <summary>The deployed services the health panel asks.</summary>
public enum HealthTarget
{
    /// <summary>The analytics API, the only one with checks and workers.</summary>
    Api = 1,

    /// <summary>The Taskly demo.</summary>
    Taskly = 2,

    /// <summary>The Stack86 demo.</summary>
    Stack86 = 3,
}
