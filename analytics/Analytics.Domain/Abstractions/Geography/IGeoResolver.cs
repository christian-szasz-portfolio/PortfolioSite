namespace Analytics.Domain.Abstractions.Geography;

/// <summary>Turns a caller IP into a country code; the IP itself is never stored.</summary>
public interface IGeoResolver
{
    /// <summary>The code returned when a country cannot be determined.</summary>
    public const string Unknown = "ZZ";

    /// <summary>Resolves an IP to an ISO 3166-1 alpha-2 code, or <see cref="Unknown"/>.</summary>
    string ResolveCountry(string? ip);
}
