namespace Analytics.Tests.Api.Http.Callers;

using System.Net;
using Analytics.Api.Http.Callers;
using Xunit;

public sealed class AddressRangeTests
{
    [Theory]
    [InlineData("8.8.8.8")]
    [InlineData("81.196.0.1")]
    [InlineData("172.224.226.10")]
    [InlineData("172.15.0.1")]
    [InlineData("172.32.0.1")]
    [InlineData("100.63.255.255")]
    [InlineData("100.128.0.1")]
    [InlineData("2606:4700::1111")]
    public void CallsAnOrdinaryAddressPublic(string address)
    {
        Assert.True(AddressRange.IsPublic(IPAddress.Parse(address)));
    }

    [Theory]
    [InlineData("0.1.2.3")]
    [InlineData("10.1.2.3")]
    [InlineData("100.64.0.1")]
    [InlineData("100.127.255.255")]
    [InlineData("127.0.0.1")]
    [InlineData("169.254.10.10")]
    [InlineData("172.16.0.1")]
    [InlineData("172.31.255.255")]
    [InlineData("192.168.1.10")]
    [InlineData("192.0.2.5")]
    [InlineData("198.18.0.1")]
    [InlineData("198.51.100.7")]
    [InlineData("203.0.113.9")]
    [InlineData("224.0.0.1")]
    [InlineData("255.255.255.255")]
    [InlineData("::")]
    [InlineData("::1")]
    [InlineData("fe80::1")]
    [InlineData("fd00::1234")]
    [InlineData("ff02::1")]
    [InlineData("2001:db8::1")]
    public void CallsAnAddressThatBelongsToNoCountryNonPublic(string address)
    {
        Assert.False(AddressRange.IsPublic(IPAddress.Parse(address)));
    }

    // A client reaching a dual-stack host over IPv6 is still the IPv4 address inside it.
    [Fact]
    public void JudgesAnIPv4AddressMappedIntoIPv6ByTheAddressInside()
    {
        Assert.False(AddressRange.IsPublic(IPAddress.Parse("::ffff:10.1.2.3")));
        Assert.True(AddressRange.IsPublic(IPAddress.Parse("::ffff:81.196.0.1")));
    }
}
