namespace Analytics.Api.Endpoints.Views;

using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;
using FastEndpoints;

/// <summary>Reads the running totals without recording anything.</summary>
public sealed class GetViewsEndpoint(IViewStore store) : EndpointWithoutRequest<ViewStats>
{
    public override void Configure()
    {
        this.Get("/api/views");
        this.AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken cancellationToken)
    {
        this.Response = await store.ReadAsync(cancellationToken);
    }
}
