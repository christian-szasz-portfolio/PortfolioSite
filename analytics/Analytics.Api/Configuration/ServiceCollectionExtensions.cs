namespace Analytics.Api.Configuration;

using Analytics.Api.Http.Callers;
using Analytics.Infrastructure.Configuration;
using Common.Security.Cors;
using Microsoft.Extensions.Options;

/// <summary>What the HTTP host adds on top of the counter itself.</summary>
public static class ServiceCollectionExtensions
{
    /// <summary>Registers the endpoint's view of a caller.</summary>
    /// <remarks>Middlewares are not registered here, because <c>UseMiddleware</c> constructs them.</remarks>
    public static IServiceCollection AddCounterHttp(this IServiceCollection services)
    {
        services.AddSingleton<IVisitorCountry, ForwardedForVisitorCountry>();

        services.AddSingleton<ICorsPolicy>(provider => new CorsPolicy(
            provider.GetRequiredService<IOptions<CounterOptions>>().Value.AllowedOrigins));

        return services;
    }
}
