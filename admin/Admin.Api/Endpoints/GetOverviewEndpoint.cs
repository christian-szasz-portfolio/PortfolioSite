namespace Admin.Api.Endpoints;

using Admin.Api.Archive;
using Admin.Api.Configuration;
using FastEndpoints;
using Microsoft.Extensions.Options;

/// <summary>Everything the dashboard needs, read from this machine's disk rather than from Azure.</summary>
/// <remarks>From the archive, so the dashboard opens instantly and works with no network.</remarks>
public sealed class GetOverviewEndpoint(
    IUsageArchive usage,
    IViewArchive views,
    IOptions<AdminOptions> options)
    : EndpointWithoutRequest<AdminOverview>
{
    public override void Configure()
    {
        this.Get("/api/admin/overview");
        this.AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<UsageDay> days = await usage.ReadAllAsync(cancellationToken);
        ViewSnapshot? snapshot = await views.LatestAsync(cancellationToken);

        // The most recent label wins where an operation was renamed: it reads as its new name
        // while keeping the history it accumulated under the old one.
        List<UsageOperation> operations =
        [
            .. days
                .SelectMany(day => day.Operations)
                .GroupBy(operation => operation.Name, StringComparer.Ordinal)
                .Select(group => new UsageOperation(
                    group.Key, group.Last().Label, group.Sum(operation => operation.Count)))
                .OrderByDescending(operation => operation.Count)
                .ThenBy(operation => operation.Name, StringComparer.Ordinal),
        ];

        AdminOptions settings = options.Value;

        this.Response = new AdminOverview(
            usage.Location,
            settings.SourceName(),
            !settings.UsesEmulator(),
            days,
            operations,
            days.Sum(day => day.Views),
            days.Sum(day => day.Interactions),
            snapshot);
    }
}
