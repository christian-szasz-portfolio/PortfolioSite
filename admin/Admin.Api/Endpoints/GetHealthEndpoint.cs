namespace Admin.Api.Endpoints;

using Admin.Api.Health;
using FastEndpoints;

/// <summary>How the analytics API is, asked when the dashboard asks and not before.</summary>
/// <remarks>
/// Apart from the overview because it is the one panel that leaves this machine. The archive
/// draws instantly whether or not the API answers, and a sleeping host takes seconds to wake.
/// </remarks>
public sealed class GetHealthEndpoint(IAnalyticsHealth health) : EndpointWithoutRequest<AnalyticsHealth>
{
    public override void Configure()
    {
        this.Get("/api/admin/health");
        this.AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken cancellationToken)
    {
        this.Response = await health.ReadAsync(cancellationToken);
    }
}
