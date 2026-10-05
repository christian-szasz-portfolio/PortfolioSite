namespace Admin.Api.Endpoints;

using Admin.Api.Health;
using FastEndpoints;

/// <summary>How one deployed service is, asked when the dashboard asks and not before.</summary>
/// <remarks>
/// One target per call, so a sleeping service does not hold up the others: the dashboard asks
/// all three at once and fills each row as it answers.
/// </remarks>
public sealed class GetHealthEndpoint(IHealthProbe probe) : EndpointWithoutRequest<TargetHealth>
{
    public override void Configure()
    {
        this.Get("/api/admin/health/{target}");
        this.AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken cancellationToken)
    {
        if (!Enum.TryParse(this.Route<string>("target"), ignoreCase: true, out HealthTarget target)
            || !Enum.IsDefined(target))
        {
            await this.Send.NotFoundAsync(cancellationToken);
            return;
        }

        this.Response = await probe.ReadAsync(target, cancellationToken);
    }
}
