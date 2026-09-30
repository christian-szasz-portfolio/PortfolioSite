using System.Text.Json;
using Admin.Api.Archive;
using Admin.Api.Configuration;
using Admin.Api.Health;
using Admin.Api.Http;
using Admin.Api.Sync;
using Analytics.Domain.Abstractions.Resilience;
using Analytics.Domain.Abstractions.Storage;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Resilience;
using Analytics.Domain.Storage;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Storage;
using Analytics.Domain.Views;
using Analytics.Infrastructure.Tables;
using Azure.Data.Tables;
using FastEndpoints;
using Microsoft.Extensions.Options;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Loopback, and nothing else. This holds a connection string to the analytics storage and every
// figure the site has collected, and it has no authentication because it never needs any: the
// only way to reach it is to be sitting at this machine.
builder.WebHost.UseUrls("http://127.0.0.1:5099");

builder.Services.AddOptions<AdminOptions>()
    .Bind(builder.Configuration.GetSection(AdminOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton(TimeProvider.System);

// The analytics table, read through the same stores the API writes with, so a change to how rows
// are named breaks this at compile time rather than making it quietly report the wrong thing.
builder.Services.AddSingleton(provider =>
{
    AdminOptions options = provider.GetRequiredService<IOptions<AdminOptions>>().Value;

    return new TableClient(options.AzureWebJobsStorage, options.ViewsTableName);
});

builder.Services.AddSingleton<ICounterTable, AzureCounterTable>();
builder.Services.AddSingleton<IRetryPolicy>(_ => new ConcurrencyRetryPolicy(5));
builder.Services.AddSingleton<ICounterIncrementer, CounterIncrementer>();
builder.Services.AddSingleton<IInteractionCatalogue, InteractionCatalogue>();
builder.Services.AddSingleton<IUsageStore, TableUsageStore>();
builder.Services.AddSingleton<IViewStore, TableViewStore>();

builder.Services.AddSingleton<IUsageArchive, FileUsageArchive>();
builder.Services.AddSingleton<IViewArchive, FileViewArchive>();
builder.Services.AddSingleton<IAnalyticsSync, AnalyticsSync>();

// The one thing here that reaches the network on a read. A typed client, so the timeout is set
// once and covers a container that has to start before it can answer.
builder.Services.AddHttpClient<IAnalyticsHealth, HttpAnalyticsHealth>((provider, client) =>
    client.Timeout = provider.GetRequiredService<IOptions<AdminOptions>>().Value.AnalyticsApiTimeout);

builder.Services.AddFastEndpoints();

WebApplication app = builder.Build();

// First, so nothing else in the pipeline runs for a caller that should not be here at all.
app.UseMiddleware<LoopbackOnlyMiddleware>();

app.UseFastEndpoints(config =>
    config.Serializer.Options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

// The dashboard, when it has been built. Without it the API still answers, which is what makes
// the two halves separately runnable.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();
