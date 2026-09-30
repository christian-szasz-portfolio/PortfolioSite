namespace Analytics.Tools.Diagnostics;

using System.Globalization;
using Analytics.Infrastructure.Diagnostics;
using Azure.Data.Tables;
using Common.Diagnostics.Azure;
using Common.Diagnostics.Models;
using Common.Diagnostics.Storage;

/// <summary>Prints a stored day of captured entries, so the digest's contents can be seen now.</summary>
/// <remarks>It reads through the same store the API writes with, so it cannot lie about the rows.</remarks>
public static class LogReport
{
    /// <summary>Reads one day and returns it as lines, in the order things happened.</summary>
    public static async Task<IReadOnlyList<string>> ReadAsync(
        string connection, string tableName, DateOnly day, CancellationToken cancellationToken)
    {
        TableLogStore store = new(
            new AzureLogTable(new TableClient(connection, tableName)),
            PortfolioDomainResolver.Create(),
            TimeProvider.System,
            PortfolioApps.Analytics);

        StoredLog stored = await store.ReadAsync(day, cancellationToken);

        List<string> lines = [$"Entries for {day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}"];

        foreach (LogEntry entry in stored.Entries)
        {
            lines.Add(
                $"  {entry.At.ToString("HH:mm:ss", CultureInfo.InvariantCulture)} "
                + $"[{entry.Severity}] {entry.Domain.Name}: {entry.Message}");

            if (entry.Exception is { } failure)
            {
                lines.Add($"    {failure.Split('\n')[0].Trim()}");
            }
        }

        if (stored.Dropped > 0)
        {
            lines.Add($"  {stored.Dropped.ToString(CultureInfo.InvariantCulture)} were dropped: the buffer was full.");
        }

        if (stored.Entries.Count == 0 && stored.Dropped == 0)
        {
            lines.Add("  Nothing was captured on this day.");
        }

        return lines;
    }
}
