namespace Analytics.Domain.Models;

using Analytics.Domain.Abstractions.Geography;

/// <summary>How a resolved country is turned into the token the counter stores it under.</summary>
public static class CountryCode
{
    /// <summary>Keeps a country code to a safe two-letter uppercase token, or unknown.</summary>
    public static string Normalise(string country)
    {
        if (country.Length == 2 && char.IsAsciiLetter(country[0]) && char.IsAsciiLetter(country[1]))
        {
            return country.ToUpperInvariant();
        }

        return IGeoResolver.Unknown;
    }
}
