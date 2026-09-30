namespace Admin.Tests.Http;

using System.Net;
using Admin.Api.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Xunit;

/// <summary>The second lock behind a loopback bind that is one flag away from being wrong.</summary>
public sealed class LoopbackOnlyMiddlewareTests
{
    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("::1")]
    public async Task LetsThisMachineThrough(string address)
    {
        Assert.Equal(HttpStatusCode.OK, await StatusFrom(IPAddress.Parse(address)));
    }

    [Theory]
    [InlineData("192.168.1.20")]
    [InlineData("10.0.0.4")]
    [InlineData("203.0.113.9")]
    public async Task RefusesEverywhereElse(string address)
    {
        Assert.Equal(HttpStatusCode.Forbidden, await StatusFrom(IPAddress.Parse(address)));
    }

    // A control that fails open is not one. The shapes that produce no address are ones this tool
    // does not serve, so an unknown caller is refused rather than assumed to be local.
    [Fact]
    public async Task RefusesACallerItCannotPlace()
    {
        Assert.Equal(HttpStatusCode.Forbidden, await StatusFrom(null));
    }

    private static async Task<HttpStatusCode> StatusFrom(IPAddress? caller)
    {
        using IHost host = await new HostBuilder()
            .ConfigureWebHost(web => web
                .UseTestServer()
                .ConfigureServices(services => services.AddLogging(logging => logging.ClearProviders()))
                .Configure(app =>
                {
                    app.Use(async (context, next) =>
                    {
                        context.Connection.RemoteIpAddress = caller;
                        await next(context);
                    });

                    app.UseMiddleware<LoopbackOnlyMiddleware>();
                    app.Run(context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status200OK;

                        return Task.CompletedTask;
                    });
                }))
            .StartAsync();

        using HttpResponseMessage response =
            await host.GetTestClient().GetAsync(new Uri("/api/admin/overview", UriKind.Relative));

        return response.StatusCode;
    }
}
