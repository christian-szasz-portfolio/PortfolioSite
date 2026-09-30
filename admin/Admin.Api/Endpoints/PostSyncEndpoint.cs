namespace Admin.Api.Endpoints;

using Admin.Api.Configuration;
using Admin.Api.Sync;
using FastEndpoints;
using Microsoft.Extensions.Options;

/// <summary>Pulls the last few days out of Azure and into the archive.</summary>
/// <remarks>A POST pressed by a person, because it is the one thing here that costs money.</remarks>
public sealed class PostSyncEndpoint(IAnalyticsSync sync, IOptions<AdminOptions> options)
    : EndpointWithoutRequest<SyncReport>
{
    public override void Configure()
    {
        this.Post("/api/admin/sync");
        this.AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken cancellationToken)
    {
        this.Response = await sync.SyncAsync(options.Value.SyncDays, cancellationToken);
    }
}
