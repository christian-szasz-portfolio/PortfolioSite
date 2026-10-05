namespace Admin.Api.Endpoints;

using System.Runtime.CompilerServices;
using Admin.Api.Health;
using FastEndpoints;

/// <summary>How every deployed service is, streamed as server-sent events while they answer.</summary>
/// <remarks>
/// One request for all three: each step is pushed as it happens, so a sleeping service does not
/// hold up the others and the page needs no timer of its own.
/// </remarks>
public sealed class GetHealthStreamEndpoint(HealthStream stream) : EndpointWithoutRequest
{
    /// <summary>The event that carries one step for one target.</summary>
    public const string StepEvent = "health";

    /// <summary>The event sent once every target has answered, so the page can close the stream.</summary>
    public const string DoneEvent = "done";

    public override void Configure()
    {
        this.Get("/api/admin/health/stream");
        this.AllowAnonymous();
    }

    public override Task HandleAsync(CancellationToken cancellationToken)
    {
        return this.Send.EventStreamAsync(this.ItemsAsync(cancellationToken), cancellationToken);
    }

    private async IAsyncEnumerable<StreamItem> ItemsAsync([EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (HealthEvent step in stream.ReadAllAsync(cancellationToken))
        {
            yield return new StreamItem(StepEvent, step);
        }

        // Without it the browser would take the closed stream for a dropped one and reconnect.
        yield return new StreamItem(DoneEvent, new { });
    }
}
