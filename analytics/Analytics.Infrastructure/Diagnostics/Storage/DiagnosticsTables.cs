namespace Analytics.Infrastructure.Diagnostics.Storage;

/// <summary>Names the table clients diagnostics owns, so a key is never a loose string.</summary>
public static class DiagnosticsTables
{
    /// <summary>The client for the table captured entries are kept in.</summary>
    public const string Logs = "diagnostics-logs";
}
