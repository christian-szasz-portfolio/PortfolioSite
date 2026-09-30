namespace Analytics.Tools.Diagnostics;

using System.Globalization;
using Analytics.Domain.Resilience;
using Analytics.Domain.Storage;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Domain.Usage.Storage;
using Analytics.Infrastructure.Tables;
using Azure.Data.Tables;

/// <summary>Prints a stored day of usage, so the digest's figures can be seen now.</summary>
/// <remarks>It reads through the same store the API writes with, so it cannot lie about the rows.</remarks>
public static class UsageReport
{
    /// <summary>Reads one day and returns it as lines, most used operation first.</summary>
    public static async Task<IReadOnlyList<string>> ReadAsync(
        string connection, string tableName, DateOnly day, CancellationToken cancellationToken)
    {
        TableClient client = new(connection, tableName);
        AzureCounterTable table = new(client);

        TableUsageStore store = new(
            table,
            new CounterIncrementer(table, new ConcurrencyRetryPolicy(5)),
            new InteractionCatalogue());

        AnalyticsSummary counted = await store.ReadAsync(day, cancellationToken);

        List<string> lines =
        [
            $"Usage for {day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}",
            $"  Views        {counted.Views.ToString(CultureInfo.InvariantCulture)}",
            $"  Interactions {counted.Interactions.ToString(CultureInfo.InvariantCulture)}",
        ];

        foreach (OperationCount operation in counted.Operations)
        {
            lines.Add($"    {operation.Kind.Label}: {operation.Count.ToString(CultureInfo.InvariantCulture)}");
        }

        if (counted.Rejected > 0)
        {
            lines.Add($"  Refused      {counted.Rejected.ToString(CultureInfo.InvariantCulture)}");
        }

        if (!counted.HasAnything)
        {
            lines.Add("  Nothing was counted on this day.");
        }

        return lines;
    }
}
