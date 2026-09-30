namespace Analytics.Infrastructure.Diagnostics;

using System.ComponentModel.DataAnnotations;

/// <summary>What the shared digest options do not know about: this API's own table and wake key.</summary>
/// <remarks>Bound from the same section as <see cref="Common.Diagnostics.DiagnosticsOptions"/>.</remarks>
public sealed class AnalyticsDiagnosticsOptions
{
    public const string SectionName = "Diagnostics";

    /// <summary>The table captured entries are kept in, a partition per day.</summary>
    [Required]
    public string LogsTableName { get; set; } = "logs";

    /// <summary>What a scheduler proves itself with at the wake endpoint. Empty turns it off.</summary>
    /// <remarks>A secret: supply it through an environment variable or user secrets, never a file.</remarks>
    public string TriggerKey { get; set; } = string.Empty;
}
