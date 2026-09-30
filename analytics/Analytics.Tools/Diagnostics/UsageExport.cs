namespace Analytics.Tools.Diagnostics;

using System.Globalization;
using System.Text;
using Analytics.Domain.Resilience;
using Analytics.Domain.Storage;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Domain.Usage.Storage;
using Analytics.Infrastructure.Tables;
using Azure.Data.Tables;

/// <summary>Writes the stored days out as a spreadsheet.</summary>
/// <remarks>One row per day and one column per operation, with empty days written as zeroes.</remarks>
public static class UsageExport
{
    /// <summary>Reads a range of days and returns them as CSV, oldest first.</summary>
    public static async Task<string> ToCsvAsync(
        string connection,
        string tableName,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        TableClient client = new(connection, tableName);
        AzureCounterTable table = new(client);
        InteractionCatalogue catalogue = new();

        TableUsageStore store = new(
            table, new CounterIncrementer(table, new ConcurrencyRetryPolicy(5)), catalogue);

        StringBuilder csv = new();
        csv.AppendLine(Header(catalogue));

        for (DateOnly day = from; day <= to; day = day.AddDays(1))
        {
            AnalyticsSummary counted = await store.ReadAsync(day, cancellationToken);

            csv.AppendLine(Row(day, counted, catalogue));
        }

        return csv.ToString();
    }

    private static string Header(InteractionCatalogue catalogue)
    {
        List<string> columns = ["day", "views", "interactions"];
        columns.AddRange(catalogue.Kinds.Select(kind => kind.Label));
        columns.Add("refused");

        return string.Join(',', columns.Select(Escape));
    }

    private static string Row(DateOnly day, AnalyticsSummary counted, InteractionCatalogue catalogue)
    {
        List<string> cells =
        [
            day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            Number(counted.Views),
            Number(counted.Interactions),
        ];

        foreach (InteractionKind kind in catalogue.Kinds)
        {
            OperationCount? operation =
                counted.Operations.FirstOrDefault(one => one.Kind.Equals(kind));

            cells.Add(Number(operation?.Count ?? 0));
        }

        cells.Add(Number(counted.Rejected));

        return string.Join(',', cells.Select(Escape));
    }

    private static string Number(int value)
    {
        return value.ToString(CultureInfo.InvariantCulture);
    }

    /// <summary>Quoted anyway, so a comma in a new operation changes a heading and not the columns.</summary>
    private static string Escape(string cell)
    {
        if (!cell.Contains(',', StringComparison.Ordinal)
            && !cell.Contains('"', StringComparison.Ordinal))
        {
            return cell;
        }

        return $"\"{cell.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }
}
