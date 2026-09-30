namespace Analytics.Infrastructure.Geo;

using Analytics.Domain.Abstractions.Geography;

/// <summary>A resolver that knows no countries: everything is <see cref="IGeoResolver.Unknown"/>.</summary>
public sealed class NullGeoResolver : IGeoResolver
{
    public string ResolveCountry(string? ip)
    {
        return IGeoResolver.Unknown;
    }
}
