namespace Admin.Api.Sync;

using Admin.Api.Archive;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;
using Microsoft.Extensions.Logging;

/// <summary>Reads analytics storage through the API's own stores and archives what it finds.</summary>
/// <remarks>A day with nothing in it is not written, so an absent file means nobody came.</remarks>
public sealed partial class AnalyticsSync(
    IUsageStore usage,
    IViewStore views,
    IUsageArchive usageArchive,
    IViewArchive viewArchive,
    TimeProvider time,
    ILogger<AnalyticsSync> logger) : IAnalyticsSync
{
    public async Task<SyncReport> SyncAsync(int days, CancellationToken cancellationToken)
    {
        DateOnly today = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);
        DateOnly from = today.AddDays(-(Math.Max(days, 1) - 1));

        int archived = 0;

        for (DateOnly day = from; day <= today; day = day.AddDays(1))
        {
            AnalyticsSummary counted = await usage.ReadAsync(day, cancellationToken);

            if (!counted.HasAnything)
            {
                continue;
            }

            await usageArchive.SaveAsync(Describe(day, counted, time.GetUtcNow()), cancellationToken);
            archived++;
        }

        ViewStats stats = await views.ReadAsync(cancellationToken);
        await viewArchive.SaveAsync(Snapshot(today, stats, time.GetUtcNow()), cancellationToken);

        Archived(logger, archived, usageArchive.Location);

        return new SyncReport(from, today, archived, stats.Total, usageArchive.Location);
    }

    // Source generated, so the location is not formatted when Information is switched off.
    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Archived {Days} days and a view snapshot into {Location}.")]
    private static partial void Archived(ILogger logger, int days, string location);

    private static UsageDay Describe(DateOnly day, AnalyticsSummary counted, DateTimeOffset at)
    {
        return new UsageDay(
            day,
            counted.Views,
            counted.Interactions,
            counted.Rejected,
            [
                .. counted.Operations.Select(operation =>
                    new UsageOperation(operation.Kind.Name, operation.Kind.Label, operation.Count)),
            ],
            at);
    }

    private static ViewSnapshot Snapshot(DateOnly day, ViewStats stats, DateTimeOffset at)
    {
        return new ViewSnapshot(
            day,
            at,
            stats.Total,
            [.. stats.Countries.Select(country => new ViewCountry(country.Code, country.Count))]);
    }
}
