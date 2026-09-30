namespace Analytics.Api.Endpoints.Interactions;

/// <summary>What the API did with a batch.</summary>
/// <param name="Accepted">How many were counted.</param>
/// <param name="Rejected">How many named an operation this API does not count.</param>
/// <remarks>Answered rather than swallowed, so an outdated page can see it is being refused.</remarks>
public sealed record InteractionReceipt(int Accepted, int Rejected);
