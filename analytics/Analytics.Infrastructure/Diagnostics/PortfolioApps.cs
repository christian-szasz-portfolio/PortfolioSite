namespace Analytics.Infrastructure.Diagnostics;

/// <summary>The apps that share one digest, so a name is never a loose string.</summary>
/// <remarks>Each name is that app root namespace, which is how its folders are read.</remarks>
public static class PortfolioApps
{
    /// <summary>This API: the site numbers and the digest itself.</summary>
    public const string Analytics = "Analytics";

    /// <summary>The assembler demo backend.</summary>
    public const string Stack86 = "Stack86";

    /// <summary>The task board demo backend.</summary>
    public const string Taskly = "Taskly";
}
