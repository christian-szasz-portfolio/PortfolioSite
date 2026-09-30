namespace Analytics.Domain.Models;

/// <summary>The public shape the counter returns: a total and a per-country breakdown.</summary>
/// <param name="Total">Every counted view, across all countries.</param>
/// <param name="Countries">Per-country tallies, most viewed first.</param>
public sealed record ViewStats(long Total, IReadOnlyList<CountryCount> Countries)
{
    /// <summary>Nothing counted yet.</summary>
    public static ViewStats Empty { get; } = new(0, []);

    /// <summary>These tallies with the given per-country counts added, still most viewed first.</summary>
    public ViewStats CombinedWith(IReadOnlyDictionary<string, long> extra)
    {
        if (extra.Count == 0)
        {
            return this;
        }

        Dictionary<string, long> byCountry = new(StringComparer.Ordinal);
        foreach (CountryCount country in this.Countries)
        {
            byCountry[country.Code] = country.Count;
        }

        long total = this.Total;
        foreach (KeyValuePair<string, long> entry in extra)
        {
            byCountry[entry.Key] = byCountry.GetValueOrDefault(entry.Key) + entry.Value;
            total += entry.Value;
        }

        List<CountryCount> countries =
        [
            .. byCountry
                .Select(entry => new CountryCount(entry.Key, entry.Value))
                .OrderByDescending(country => country.Count),
        ];

        return new ViewStats(total, countries);
    }
}
