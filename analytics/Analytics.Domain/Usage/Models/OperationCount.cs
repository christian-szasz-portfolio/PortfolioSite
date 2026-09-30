namespace Analytics.Domain.Usage.Models;

/// <summary>How many times one kind of interaction happened in a window.</summary>
/// <param name="Kind">The operation, carrying the words the digest prints.</param>
/// <param name="Count">How many of them.</param>
public sealed record OperationCount(InteractionKind Kind, int Count);
