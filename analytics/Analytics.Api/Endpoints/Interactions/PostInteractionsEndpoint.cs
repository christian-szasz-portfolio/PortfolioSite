namespace Analytics.Api.Endpoints.Interactions;

using Analytics.Api.Http.Callers;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;
using Common.Security.Http;
using FastEndpoints;

/// <summary>Counts what a reader did on the page.</summary>
/// <remarks>Nothing here identifies anybody, and the catalogue is the allowlist.</remarks>
public sealed class PostInteractionsEndpoint(
    IInteractionCatalogue catalogue,
    IExcludedCallers excluded,
    IAnalyticsRecorder analytics,
    TimeProvider time,
    ILogger<PostInteractionsEndpoint> logger)
    : Endpoint<InteractionRequest, InteractionReceipt>
{
    public override void Configure()
    {
        this.Post("/api/interactions");
        this.AllowAnonymous();
    }

    public override Task HandleAsync(InteractionRequest req, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(req);

        // An excluded caller's reports are dropped whole
        if (excluded.IsExcluded(this.HttpContext.Request.ForwardedFor()))
        {
            this.Response = new InteractionReceipt(0, 0);
            return Task.CompletedTask;
        }

        // One instant for the batch. They arrived together and are counted together, and a clock
        // read per event would only invent a precision the reporting does not have.
        DateTimeOffset at = time.GetUtcNow();

        int accepted = 0;
        int rejected = 0;

        foreach (InteractionReport report in req.Events)
        {
            InteractionKind? kind = catalogue.Resolve(report.Kind);

            if (kind is null)
            {
                analytics.RecordRejection();
                rejected++;

                continue;
            }

            analytics.RecordInteraction(Interaction.Of(kind, report.Target, at));
            accepted++;
        }

        if (rejected > 0)
        {
            // A page names an operation this API no longer counts, or never did.
            // The name itself is not logged: it is unvalidated wire data and this line ends up in an email.
            // Volume stays bounded by the rate limiter in front and the sink's drop-and-report behind.
            logger.LogWarning(
                "Refused {Count} interactions naming operations this API does not count.", rejected);
        }

        this.Response = new InteractionReceipt(accepted, rejected);

        return Task.CompletedTask;
    }
}
