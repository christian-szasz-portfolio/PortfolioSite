namespace Admin.Api.Archive;

/// <summary>One country's tally in a snapshot.</summary>
/// <param name="Code">The two-letter code, or ZZ where the country could not be determined.</param>
/// <param name="Count">Views counted from it.</param>
public sealed record ViewCountry(string Code, long Count);
