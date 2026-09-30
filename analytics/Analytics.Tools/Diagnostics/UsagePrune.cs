namespace Analytics.Tools.Diagnostics;

using Analytics.Domain.Usage.Storage;
using Analytics.Infrastructure.Tables;
using Azure.Data.Tables;

/// <summary>Enforces the retention window now, rather than waiting for the host to do it.</summary>
/// <remarks>For when the daily sweep is not soon enough, such as after shortening the window.</remarks>
public static class UsagePrune
{
    /// <summary>Drops every stored day before the given one, and answers how many went.</summary>
    public static Task<int> DropBeforeAsync(
        string connection, string tableName, DateOnly oldestKept, CancellationToken cancellationToken)
    {
        AzureCounterTable table = new(new TableClient(connection, tableName));

        return new UsageRetention(table).DropBeforeAsync(oldestKept, cancellationToken);
    }
}
