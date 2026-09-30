namespace Analytics.Api.Endpoints.Interactions;

/// <summary>A batch of things the page says a reader did.</summary>
/// <param name="Events">The batch, bounded by the validator.</param>
/// <remarks>A batch rather than one request per click, so reporting does not spend the rate limit.</remarks>
public sealed record InteractionRequest(IReadOnlyList<InteractionReport> Events);
