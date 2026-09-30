namespace Analytics.Api.Http.Callers;

using Analytics.Domain.Abstractions.Geography;
using Analytics.Infrastructure.Configuration;
using Common.Security.Callers;
using Microsoft.Extensions.Options;

/// <summary>Resolves the forwarded address to a country; only the country leaves the method.</summary>
public sealed class ForwardedForVisitorCountry(
    IGeoResolver geo,
    IOptions<CounterOptions> options) : IVisitorCountry
{
    public string Resolve(string? forwardedFor)
    {
        return geo.ResolveCountry(
            ClientIp.FromForwardedFor(forwardedFor, options.Value.TrustedProxyCount));
    }
}
