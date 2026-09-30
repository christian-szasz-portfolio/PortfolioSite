namespace Analytics.Infrastructure.Configuration;

using Analytics.Domain.Abstractions.Geography;
using Analytics.Domain.Abstractions.Resilience;
using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Resilience;
using Analytics.Domain.Storage;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Storage;
using Analytics.Domain.Views;
using Analytics.Infrastructure.Buffering;
using Analytics.Infrastructure.Diagnostics;
using Analytics.Infrastructure.Diagnostics.Storage;
using Analytics.Infrastructure.Geo;
using Analytics.Infrastructure.Retention;
using Analytics.Infrastructure.Tables;
using Analytics.Infrastructure.Usage;
using Azure.Data.Tables;
using Common.Diagnostics;
using Common.Diagnostics.Abstractions;
using Common.Diagnostics.Azure;
using Common.Diagnostics.Capture;
using Common.Diagnostics.Composition;
using Common.Diagnostics.Composition.Sections;
using Common.Diagnostics.Delivery;
using Common.Diagnostics.Heartbeats;
using Common.Diagnostics.Scheduling;
using Common.Diagnostics.Storage;
using Common.Security;
using Common.Security.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

/// <summary>The composition root: every contract is bound to one implementation here.</summary>
public static class ServiceCollectionExtensions
{
    /// <summary>How long all the workers together may take to stop, which the host otherwise caps at 30 seconds.</summary>
    /// <remarks>
    /// The sum of what they allow themselves: three flushes of ten seconds and a digest of twenty.
    /// They are stopped one after another, so the default ceiling sits below their own budget, and
    /// a container that sleeps several times a day would be killed part way through a write. The
    /// platform has to allow at least as long: see terminationGracePeriodSeconds in
    /// the infrastructure repo's container.bicep.
    /// </remarks>
    private static readonly TimeSpan ShutdownBudget = TimeSpan.FromSeconds(60);

    /// <summary>Registers the options, the storage, the geography and the write-behind buffer.</summary>
    public static IServiceCollection AddCounter(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<HostOptions>(options => options.ShutdownTimeout = ShutdownBudget);

        // Registered ahead of every worker that writes, and so stopped after all of them: the host
        // stops hosted services in reverse registration order, one at a time. The digest is the
        // only worker that reads what the others store, so it goes last, or the digest a sleeping
        // container sends reports a table still missing what that same shutdown is about to write.
        services.AddHostedService<LogDigestService>();

        return services
            .AddCounterOptions(configuration)
            .AddCounterStorage()
            .AddCounterGeography()
            .AddCounterBuffering()
            .AddCounterAnalytics()
            .AddCounterDiagnostics(configuration);
    }

    /// <summary>Bound once and validated at startup, so a missing setting fails the host there.</summary>
    private static IServiceCollection AddCounterOptions(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<CounterOptions>()
            .Bind(configuration)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        return services;
    }

    /// <summary>The table, the retry strategy that guards its writes, and the store above them.</summary>
    private static IServiceCollection AddCounterStorage(this IServiceCollection services)
    {
        services.AddSingleton(provider =>
        {
            CounterOptions options = Settings(provider);
            return new TableClient(options.AzureWebJobsStorage, options.ViewsTableName);
        });

        // Where the background workers say they are still running, read back by the readiness
        // check. In memory, because the question is about this process.
        services.AddSingleton<IHeartbeatLog, HeartbeatLog>();

        services.AddSingleton<ICounterTable, AzureCounterTable>();
        services.AddSingleton<ICounterIncrementer, CounterIncrementer>();

        // Strategy: the store counts, the policy decides how a lost race is retried.
        services.AddSingleton<IRetryPolicy>(provider =>
            new ConcurrencyRetryPolicy(Settings(provider).MaxWriteAttempts));

        services.AddSingleton<IViewAccumulator, TableViewStore>();
        services.AddHostedService<TableProvisioner>();

        services.AddSingleton<IRateLimiter>(provider =>
        {
            CounterOptions options = Settings(provider);

            // Per caller first: it is the selective one, and refusing there costs nothing.
            // The shared tier behind it is what a flood from many addresses runs into.
            return new TieredRateLimiter(
                RateLimitTier.PerCaller(new FixedWindowRateLimiter(
                    options.RateLimitPermits,
                    options.RateLimitWindow,
                    TimeProvider.System,
                    options.MaxTrackedCallers)),
                RateLimitTier.Shared(
                    new FixedWindowRateLimiter(
                        options.InstanceRateLimitPermits,
                        options.RateLimitWindow,
                        TimeProvider.System,
                        maxPartitions: 1),
                    "instance"));
        });

        // The rate limiter reads the same trusted-hop count the counter uses, so one setting
        // decides how far both trust the forwarded-for chain.
        services.AddSingleton<IOptions<ForwardedHeaderOptions>>(provider =>
            Options.Create(new ForwardedHeaderOptions { TrustedProxyCount = Settings(provider).TrustedProxyCount }));

        return services;
    }

    /// <summary>Factory: which resolver is right depends on what is on disk when the host starts.</summary>
    private static IServiceCollection AddCounterGeography(this IServiceCollection services)
    {
        services.AddSingleton<IFileProbe, PhysicalFileProbe>();
        services.AddSingleton<IGeoResolverFactory, GeoResolverFactory>();
        services.AddSingleton(provider => provider.GetRequiredService<IGeoResolverFactory>().Create());

        return services;
    }

    /// <summary>The buffer and durable storage answer different contracts, so neither depends on the other.</summary>
    private static IServiceCollection AddCounterBuffering(this IServiceCollection services)
    {
        services.AddSingleton<PendingViews>();
        services.AddSingleton<ViewFlushGate>();
        services.AddSingleton(provider => new ViewNudges(Settings(provider).WakeUpQueueLength));
        services.AddSingleton<IViewBuffer, ViewBuffer>();
        services.AddSingleton<IViewStore, BufferedViewStore>();
        services.AddHostedService<ViewFlushService>();

        return services;
    }

    /// <summary>What the page reports about itself.</summary>
    /// <remarks>One window per process, so the recorder, the window and the store are all singletons.</remarks>
    private static IServiceCollection AddCounterAnalytics(this IServiceCollection services)
    {
        services.AddSingleton<IInteractionCatalogue, InteractionCatalogue>();

        services.AddSingleton<InMemoryAnalyticsWindow>();
        services.AddSingleton<IAnalyticsRecorder>(
            provider => provider.GetRequiredService<InMemoryAnalyticsWindow>());
        services.AddSingleton<IAnalyticsWindow>(
            provider => provider.GetRequiredService<InMemoryAnalyticsWindow>());

        services.AddSingleton<IUsageStore, TableUsageStore>();
        services.AddSingleton<IUsageRetention, UsageRetention>();
        services.AddHostedService<UsageFlushService>();

        return services;
    }

    /// <summary>The emailed log digest, with each lifetime chosen rather than defaulted.</summary>
    private static IServiceCollection AddCounterDiagnostics(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<DiagnosticsOptions>()
            .Bind(configuration.GetSection(DiagnosticsOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<AnalyticsDiagnosticsOptions>()
            .Bind(configuration.GetSection(AnalyticsDiagnosticsOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton(TimeProvider.System);

        // Every app that writes into the shared day is declared here, because this is the
        // process that reads them back and has to know where each one sections.
        services.AddSingleton<IDomainResolver>(_ => PortfolioDomainResolver.Create());
        services.AddSingleton<ILogSink>(provider => new BufferedLogSink(
            provider.GetRequiredService<IOptions<DiagnosticsOptions>>().Value.Capacity));

        services.AddTransient<IHtmlEmailBuilder, HtmlEmailBuilder>();
        services.AddSingleton<Func<IHtmlEmailBuilder>>(
            provider => provider.GetRequiredService<IHtmlEmailBuilder>);

        // Order is not load bearing: the two claim disjoint sections, and a test holds them
        // to that. The fallback is registered last all the same, so the list reads correctly.
        services.AddSingleton<ISectionRenderer, FailureSectionRenderer>();
        services.AddSingleton<ISectionRenderer, NoteSectionRenderer>();
        services.AddSingleton<ISectionRendererFactory, SectionRendererFactory>();
        services.AddSingleton<IDigestComposer>(provider => new DigestComposer(
            provider.GetRequiredService<Func<IHtmlEmailBuilder>>(),
            provider.GetRequiredService<ISectionRendererFactory>(),
            provider.GetRequiredService<TimeProvider>(),
            "portfolio"));

        // Its own table and its own client: the counter's rows hold numbers, these hold text,
        // and a day of entries is dropped whole without touching a counter.
        services.AddKeyedSingleton(DiagnosticsTables.Logs, (provider, _) =>
        {
            CounterOptions counter = Settings(provider);
            AnalyticsDiagnosticsOptions options =
                provider.GetRequiredService<IOptions<AnalyticsDiagnosticsOptions>>().Value;

            return new TableClient(counter.AzureWebJobsStorage, options.LogsTableName);
        });

        services.AddSingleton<ILogTable>(provider =>
            new AzureLogTable(provider.GetRequiredKeyedService<TableClient>(DiagnosticsTables.Logs)));

        services.AddSingleton<ILogStore>(provider => new TableLogStore(
            provider.GetRequiredService<ILogTable>(),
            provider.GetRequiredService<IDomainResolver>(),
            provider.GetRequiredService<TimeProvider>(),
            PortfolioApps.Analytics));
        services.AddSingleton<ILogRetention, LogRetention>();
        services.AddHostedService<LogFlushService>();

        // One sweep for both windows, so a day of usage and a day of entries expire alike.
        services.AddHostedService<RetentionService>();

        services.AddSingleton<IDigestLedgerTable, CounterTableDigestLedgerTable>();
        services.AddSingleton<IDigestLedger, TableDigestLedger>();
        services.AddSingleton<IDigestDispatcher, DigestDispatcher>();

        services.AddSingleton<IDigestSource, DigestSource>();
        services.AddSingleton<IDigestScheduleFactory, DigestScheduleFactory>();
        services.AddSingleton<IEmailTransportFactory, EmailTransportFactory>();
        services.AddTransient<IEmailTransport>(
            provider => provider.GetRequiredService<IEmailTransportFactory>().Create());

        // The digest worker itself is registered in AddCounter, ahead of the flushes whose rows
        // it reads, because that is what decides the order they stop in.
        return services;
    }

    private static CounterOptions Settings(IServiceProvider provider)
    {
        return provider.GetRequiredService<IOptions<CounterOptions>>().Value;
    }
}
