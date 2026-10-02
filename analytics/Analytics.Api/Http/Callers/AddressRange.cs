namespace Analytics.Api.Http.Callers;

using System.Net;
using System.Net.Sockets;

/// <summary>Tells an address that belongs to a country from one that cannot.</summary>
public static class AddressRange
{
    /// <summary>False for private, shared, loopback, link-local, documentation and multicast ranges.</summary>
    public static bool IsPublic(IPAddress address)
    {
        ArgumentNullException.ThrowIfNull(address);

        IPAddress plain = address.IsIPv4MappedToIPv6 ? address.MapToIPv4() : address;
        byte[] octets = plain.GetAddressBytes();

        return plain.AddressFamily == AddressFamily.InterNetwork
            ? IsPublicV4(octets)
            : IsPublicV6(plain, octets);
    }

    private static bool IsPublicV4(byte[] octets)
    {
        byte first = octets[0];
        byte second = octets[1];

        bool special = first == 0
            || first == 10
            || first == 127
            || first >= 224
            || (first == 100 && second is >= 64 and <= 127)
            || (first == 169 && second == 254)
            || (first == 172 && second is >= 16 and <= 31)
            || (first == 192 && second == 168)
            || (first == 198 && second is 18 or 19)
            || (first == 192 && second == 0 && octets[2] is 0 or 2)
            || (first == 198 && second == 51 && octets[2] == 100)
            || (first == 203 && second == 0 && octets[2] == 113);

        return !special;
    }

    private static bool IsPublicV6(IPAddress address, byte[] octets)
    {
        bool special = address.Equals(IPAddress.IPv6None)
            || IPAddress.IsLoopback(address)
            || address.IsIPv6LinkLocal
            || address.IsIPv6Multicast
            || (octets[0] & 0xFE) == 0xFC
            || (octets[0] == 0x20 && octets[1] == 0x01 && octets[2] == 0x0D && octets[3] == 0xB8);

        return !special;
    }
}
