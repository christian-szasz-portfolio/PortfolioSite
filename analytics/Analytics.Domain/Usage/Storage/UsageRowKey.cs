namespace Analytics.Domain.Usage.Storage;

using System.Globalization;
using Analytics.Domain.Usage.Models;

/// <summary>The one place that knows where a day of usage is kept and how its rows are named.</summary>
/// <remarks>A partition per day, so a day can be read or dropped without touching the others.</remarks>
public static class UsageRowKey
{
    /// <summary>The row counting views for the day.</summary>
    public const string Views = "views";

    /// <summary>The row counting interactions the API did not recognise.</summary>
    public const string Rejected = "rejected";

    /// <summary>What every usage partition's name begins with, and nothing else does.</summary>
    public const string PartitionPrefix = "usage-";

    private const string DayFormat = "yyyy-MM-dd";

    /// <summary>Operations are prefixed, so a kind cannot shadow a reserved row.</summary>
    private const string OperationPrefix = "op.";

    /// <summary>Where one day of usage is kept.</summary>
    public static string PartitionFor(DateOnly day)
    {
        return PartitionPrefix + day.ToString(DayFormat, CultureInfo.InvariantCulture);
    }

    /// <summary>The day a partition holds, or false when the name is not one of ours.</summary>
    public static bool TryDayOf(string partition, out DateOnly day)
    {
        day = default;

        return partition.StartsWith(PartitionPrefix, StringComparison.Ordinal)
            && DateOnly.TryParseExact(
                partition[PartitionPrefix.Length..],
                DayFormat,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out day);
    }

    /// <summary>The row one operation is counted in.</summary>
    public static string ForOperation(InteractionKind kind)
    {
        ArgumentNullException.ThrowIfNull(kind);

        return OperationPrefix + kind.Name;
    }

    /// <summary>Whether a row counts an operation rather than views or refusals.</summary>
    public static bool IsOperation(string rowKey)
    {
        return rowKey.StartsWith(OperationPrefix, StringComparison.Ordinal);
    }

    /// <summary>The wire name a row stands for. Only valid when <see cref="IsOperation"/>.</summary>
    public static string OperationOf(string rowKey)
    {
        return rowKey[OperationPrefix.Length..];
    }
}
