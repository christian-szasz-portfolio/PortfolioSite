namespace Admin.Api.Archive;

/// <summary>One operation on one archived day.</summary>
/// <param name="Name">The wire name, which is what stays stable across a relabelling.</param>
/// <param name="Label">What it was called when the day was archived.</param>
/// <param name="Count">How many times it happened.</param>
public sealed record UsageOperation(string Name, string Label, int Count);
