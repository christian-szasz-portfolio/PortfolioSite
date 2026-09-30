namespace Analytics.Api.Endpoints.Views;

using Analytics.Api.Http.Callers;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;
using Analytics.Domain.Usage.Abstractions;
using Common.Security.Http;
using FastEndpoints;

/// <summary>Records a view and answers with the updated totals, taking no body from the caller.</summary>
public sealed class PostViewsEndpoint(
    IViewStore store,
    IVisitorCountry visitor,
    IAnalyticsRecorder analytics) : EndpointWithoutRequest<ViewStats>
{
    public override void Configure()
    {
        this.Post("/api/views");
        this.AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken cancellationToken)
    {
        string country = visitor.Resolve(this.HttpContext.Request.ForwardedFor());

        this.Response = await store.RecordAsync(country, cancellationToken);

        // Counted here rather than in the store, because this is what a view is: a request the
        // API accepted. The stored tally is per country and cumulative; this one is per window
        // and exists only to be reported in the digest.
        analytics.RecordView();
    }
}
