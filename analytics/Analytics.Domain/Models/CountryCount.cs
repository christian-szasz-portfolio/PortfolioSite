namespace Analytics.Domain.Models;

/// <summary>A single country's running tally.</summary>
/// <param name="Code">ISO 3166-1 alpha-2 code, or "ZZ" when the country is unknown.</param>
/// <param name="Count">How many views have come from that country.</param>
public sealed record CountryCount(string Code, long Count);
