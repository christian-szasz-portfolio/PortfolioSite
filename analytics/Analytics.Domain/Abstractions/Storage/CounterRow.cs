namespace Analytics.Domain.Abstractions.Storage;

/// <summary>A single counter row: its value and the ETag it was read at.</summary>
public readonly record struct CounterRow(long Value, string ETag);
