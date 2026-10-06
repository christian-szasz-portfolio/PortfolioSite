namespace Analytics.Api.Http.Callers;

using System.Net;
using Analytics.Infrastructure.Configuration;
using Common.Security.Callers;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

/// <summary>Matches the caller against the addresses and ranges in <see cref="CounterOptions.ExcludedAddresses"/>.</summary>
public sealed partial class ConfiguredExcludedCallers : IExcludedCallers
{
    private readonly IReadOnlyList<IPNetwork> excluded;
    private readonly int trustedProxyCount;

    public ConfiguredExcludedCallers(IOptions<CounterOptions> options, ILogger<ConfiguredExcludedCallers> logger)
    {
        ArgumentNullException.ThrowIfNull(options);

        this.trustedProxyCount = options.Value.TrustedProxyCount;

        List<IPNetwork> networks = [];
        string[] entries = options.Value.ExcludedAddresses.Split(
            ',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        for (int index = 0; index < entries.Length; index++)
        {
            if (TryRead(entries[index], out IPNetwork network))
            {
                networks.Add(network);
            }
            else
            {
                Unreadable(logger, index + 1);
            }
        }

        this.excluded = networks;
    }

    public bool IsExcluded(string? forwardedFor)
    {
        if (this.excluded.Count == 0)
        {
            return false;
        }

        string? ip = ClientIp.FromForwardedFor(forwardedFor, this.trustedProxyCount);

        if (ip is null || !IPAddress.TryParse(ip, out IPAddress? address))
        {
            return false;
        }

        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        return this.excluded.Any(network => network.Contains(address));
    }

    /// <summary>A single address is read as a range holding only itself.</summary>
    private static bool TryRead(string entry, out IPNetwork network)
    {
        if (entry.Contains('/', StringComparison.Ordinal))
        {
            return IPNetwork.TryParse(entry, out network);
        }

        if (IPAddress.TryParse(entry, out IPAddress? address))
        {
            int bits = address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6 ? 128 : 32;
            network = new IPNetwork(address, bits);

            return true;
        }

        network = default;

        return false;
    }

    // The position only, never the entry: the list is the owner's own address.
    [LoggerMessage(Level = LogLevel.Warning, Message = "Excluded address entry {Position} could not be read and is ignored.")]
    private static partial void Unreadable(ILogger logger, int position);
}
