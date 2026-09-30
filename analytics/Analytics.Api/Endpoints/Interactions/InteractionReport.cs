namespace Analytics.Api.Endpoints.Interactions;

/// <summary>One thing the page says a reader did.</summary>
/// <param name="Kind">The wire name of the operation, which must be one the catalogue knows.</param>
/// <param name="Target">What it happened to: a route, a section, a project slug. Optional.</param>
/// <remarks>Both fields come off the wire, so the kind is resolved and the target cleaned.</remarks>
public sealed record InteractionReport(string Kind, string? Target);
