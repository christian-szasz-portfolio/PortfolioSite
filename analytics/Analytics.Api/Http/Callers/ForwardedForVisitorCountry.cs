namespace Analytics.Api.Http.Callers;

using System.Net;
using Analytics.Domain.Abstractions.Geography;
using Analytics.Infrastructure.Configuration;
using Common.Security.Callers;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

/// <summary>Resolves the forwarded address to a country; only the country leaves the method.</summary>
public sealed partial class ForwardedForVisitorCountry(
    IGeoResolver geo,
    IOptions<CounterOptions> options,
    ILogger<ForwardedForVisitorCountry> logger) : IVisitorCountry
{
    public string Resolve(string? forwardedFor)
    {
        string? ip = ClientIp.FromForwardedFor(forwardedFor, options.Value.TrustedProxyCount);
        string country = geo.ResolveCountry(ip);

        if (country == IGeoResolver.Unknown)
        {
            Unresolved(logger, Describe(ReasonFor(forwardedFor, ip)));
        }

        return country;
    }

    /// <summary>Which of the four ways a country goes missing this was, from the address alone.</summary>
    private static UnknownReason ReasonFor(string? forwardedFor, string? ip)
    {
        if (string.IsNullOrWhiteSpace(forwardedFor))
        {
            return UnknownReason.NoAddress;
        }

        if (ip is null || !IPAddress.TryParse(ip, out IPAddress? address))
        {
            return UnknownReason.UnusableAddress;
        }

        return AddressRange.IsPublic(address) ? UnknownReason.NotInDatabase : UnknownReason.NonPublicAddress;
    }

    private static string Describe(UnknownReason reason)
    {
        return reason switch
        {
            UnknownReason.NoAddress => "the request carried no address",
            UnknownReason.UnusableAddress => "the address in the request could not be read",
            UnknownReason.NonPublicAddress => "a private, shared or special address, which belongs to no country",
            _ => "a public address the GeoIP database has no country for",
        };
    }

    // The reason only, never the address: the privacy notice says the address is not recorded.
    [LoggerMessage(Level = LogLevel.Warning, Message = "A view was recorded with an unknown country: {Reason}.")]
    private static partial void Unresolved(ILogger logger, string reason);
}
