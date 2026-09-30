namespace Analytics.Infrastructure.Diagnostics;

using System.Globalization;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;
using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Capture;
using Common.Diagnostics.Models;

/// <summary>Reads the day's kept entries and its usage into one window.</summary>
/// <remarks>Two reads, so a digest that fails to send leaves the day exactly as it found it.</remarks>
public sealed class DigestSource(ILogStore logs, IUsageStore usage) : IDigestSource
{
    public async Task<DigestWindow> ReadAsync(DateOnly day, CancellationToken cancellationToken)
    {
        AnalyticsSummary counted = await usage.ReadAsync(day, cancellationToken);
        StoredLog stored = await logs.ReadAsync(day, cancellationToken);

        return new DigestWindow(day, stored.Entries, stored.Dropped, FactsFor(counted), counted.HasAnything);
    }

    private static IReadOnlyList<DigestFact> FactsFor(AnalyticsSummary counted)
    {
        List<DigestFact> facts =
        [
            new("Views", counted.Views.ToString(CultureInfo.InvariantCulture)),
            new("Interactions", counted.Interactions.ToString(CultureInfo.InvariantCulture)),
            new("Operations", Operations(counted)),
        ];

        if (counted.Rejected > 0)
        {
            facts.Add(new DigestFact("Refused interactions", counted.Rejected.ToString(CultureInfo.InvariantCulture)));
        }

        return facts;
    }

    /// <summary>Each operation and its count, most used first, on one line.</summary>
    private static string Operations(AnalyticsSummary analytics)
    {
        if (analytics.Operations.Count == 0)
        {
            return "none";
        }

        return string.Join(
            ", ",
            analytics.Operations.Select(operation =>
                $"{operation.Kind.Label} {operation.Count.ToString(CultureInfo.InvariantCulture)}"));
    }
}
