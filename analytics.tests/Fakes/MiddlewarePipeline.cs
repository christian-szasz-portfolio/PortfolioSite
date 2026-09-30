namespace Analytics.Tests.Fakes;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>A real ASP.NET Core pipeline holding one middleware and a stub endpoint behind it.</summary>
internal static class MiddlewarePipeline
{
    /// <summary>Builds a host whose pipeline is <paramref name="configure"/>, and returns its client.</summary>
    public static async Task<(IHost Host, HttpClient Client)> StartAsync(
        Action<IServiceCollection> services,
        Action<IApplicationBuilder> configure)
    {
        IHost host = await new HostBuilder()
            .ConfigureWebHost(web => web
                .UseTestServer()
                .ConfigureServices(collection =>
                {
                    collection.AddLogging(logging => logging.ClearProviders());
                    services(collection);
                })
                .Configure(configure))
            .StartAsync();

        return (host, host.GetTestClient());
    }
}
