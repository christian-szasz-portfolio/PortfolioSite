namespace Analytics.Tests.Architecture;

using Analytics.Infrastructure.Buffering;
using Analytics.Infrastructure.Configuration;
using Analytics.Infrastructure.Usage;
using Common.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Xunit;

/// <summary>What a container that sleeps depends on: the order the workers stop in, and how long they have.</summary>
/// <remarks>
/// Both are registration decisions with no other trace in the code, and both are invisible until
/// a shutdown loses what it was about to write, which is the one failure nobody sees happen.
/// </remarks>
public sealed class ShutdownOrderTests
{
    /// <summary>Everything that has to have finished storing before the digest reads the day back.</summary>
    private static readonly Type[] Writers =
    [
        typeof(ViewFlushService),
        typeof(UsageFlushService),
        typeof(LogFlushService),
    ];

    [Fact]
    public void StopsTheDigestAfterEveryWorkerThatWrites()
    {
        // Reverse registration order is the order they stop in, so the digest is registered first.
        List<Type> registered = HostedServices();

        int digest = registered.IndexOf(typeof(LogDigestService));
        Assert.NotEqual(-1, digest);

        foreach (Type writer in Writers)
        {
            int position = registered.IndexOf(writer);

            Assert.NotEqual(-1, position);
            Assert.True(
                digest < position,
                $"{writer.Name} is registered before the digest, so it stops after it and the digest reads a table it has not written to yet.");
        }
    }

    [Fact]
    public void AllowsTheWorkersLongerThanTheHostWouldByDefault()
    {
        ServiceCollection services = new();
        services.AddCounter(new ConfigurationBuilder().Build());

        using ServiceProvider provider = services.BuildServiceProvider();
        HostOptions options = provider.GetRequiredService<IOptions<HostOptions>>().Value;

        // Their own budget: three flushes of ten seconds and a digest of twenty, one after another.
        Assert.True(
            options.ShutdownTimeout >= TimeSpan.FromSeconds(50),
            $"{options.ShutdownTimeout} is under what the workers allow themselves, so the last one is cut short.");
    }

    private static List<Type> HostedServices()
    {
        ServiceCollection services = new();
        services.AddCounter(new ConfigurationBuilder().Build());

        return
        [
            .. from descriptor in services
               where descriptor.ServiceType == typeof(IHostedService)
               select descriptor.ImplementationType into type
               where type is not null
               select type,
        ];
    }
}
