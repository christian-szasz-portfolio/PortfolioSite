namespace Analytics.Domain.Views;

using Analytics.Domain.Models;

/// <summary>The one place that knows how counter rows are named.</summary>
public static class CounterRowKey
{
    /// <summary>Where the view counter's rows live. Usage keeps a partition per day elsewhere.</summary>
    public const string Partition = "site";

    /// <summary>The row holding every counted view, across all countries.</summary>
    public const string Total = "TOTAL";

    private const string CountryPrefix = "C_";

    /// <summary>The row a country's tally belongs in, normalising the code on the way.</summary>
    public static string ForCountry(string country)
    {
        return CountryPrefix + CountryCode.Normalise(country);
    }

    /// <summary>Whether a row key holds a country tally rather than the total.</summary>
    public static bool IsCountry(string rowKey)
    {
        return rowKey.StartsWith(CountryPrefix, StringComparison.Ordinal);
    }

    /// <summary>The country code a row key stands for. Only valid when <see cref="IsCountry"/>.</summary>
    public static string CountryOf(string rowKey)
    {
        return rowKey[CountryPrefix.Length..];
    }
}
