namespace Analytics.Tests.Api.Endpoints.Interactions;

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Analytics.Api.Endpoints.Interactions;
using Analytics.Api.Http.Callers;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Infrastructure.Diagnostics;
using Analytics.Infrastructure.Usage;
using Analytics.Tests.Fakes;
using Common.Diagnostics.Delivery;
using Common.Diagnostics.Scheduling;
using FastEndpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

/// <summary>The endpoint through a real pipeline, the way a browser reaches it.</summary>
public sealed class PostInteractionsEndpointTests
{
    private static readonly JsonSerializerOptions Camel =
        new(JsonSerializerDefaults.Web) { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    [Fact]
    public async Task CountsWhatThePageSaysAReaderDid()
    {
        (WebApplication host, HttpClient client, InMemoryAnalyticsWindow window) = await StartAsync();

        using (host)
        {
            using HttpResponseMessage response = await PostAsync(
                client,
                [new InteractionReport("route", "/cv"), new InteractionReport("section", "work")]);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            InteractionReceipt? receipt =
                await response.Content.ReadFromJsonAsync<InteractionReceipt>(Camel);

            Assert.Equal(2, receipt?.Accepted);
            Assert.Equal(0, receipt?.Rejected);

            AnalyticsSummary summary = window.Take();
            Assert.Equal(2, summary.Interactions);
            Assert.Equal(0, summary.Views);
        }
    }

    // The catalogue is the allowlist. A name it does not know is counted as a refusal and goes
    // no further, so nothing a caller invents can become an operation in the email.
    [Fact]
    public async Task RefusesAnOperationItDoesNotCount()
    {
        (WebApplication host, HttpClient client, InMemoryAnalyticsWindow window) = await StartAsync();

        using (host)
        {
            using HttpResponseMessage response = await PostAsync(
                client,
                [new InteractionReport("route", "/cv"), new InteractionReport("mine-them", "all")]);

            InteractionReceipt? receipt =
                await response.Content.ReadFromJsonAsync<InteractionReceipt>(Camel);

            Assert.Equal(1, receipt?.Accepted);
            Assert.Equal(1, receipt?.Rejected);

            AnalyticsSummary summary = window.Take();
            Assert.Equal(1, summary.Interactions);
            Assert.Equal(1, summary.Rejected);
            Assert.Equal(InteractionCatalogue.Route, Assert.Single(summary.Operations).Kind);
        }
    }

    [Fact]
    public async Task RefusesABatchBiggerThanItSaysItTakes()
    {
        (WebApplication host, HttpClient client, InMemoryAnalyticsWindow window) = await StartAsync();

        using (host)
        {
            InteractionReport[] flood =
            [
                .. Enumerable
                    .Range(0, InteractionRequestValidator.MaxEvents + 1)
                    .Select(_ => new InteractionReport("route", "/cv")),
            ];

            using HttpResponseMessage response = await PostAsync(client, flood);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.False(window.Take().HasAnything);
        }
    }

    [Fact]
    public async Task RefusesABatchWithNothingInIt()
    {
        (WebApplication host, HttpClient client, InMemoryAnalyticsWindow _) = await StartAsync();

        using (host)
        {
            using HttpResponseMessage response = await PostAsync(client, []);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }

    // A view is a POST the API accepted, counted where that is decided rather than in the store.
    [Fact]
    public async Task CountsAViewWhenOneIsRecorded()
    {
        (WebApplication host, HttpClient client, InMemoryAnalyticsWindow window) = await StartAsync();

        using (host)
        {
            using HttpResponseMessage response =
                await client.PostAsync(new Uri("/api/views", UriKind.Relative), content: null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(1, window.Take().Views);
        }
    }

    private static Task<HttpResponseMessage> PostAsync(
        HttpClient client, IReadOnlyList<InteractionReport> events)
    {
        return client.PostAsJsonAsync(
            new Uri("/api/interactions", UriKind.Relative), new InteractionRequest(events), Camel);
    }

    /// <summary>A real host, and a <c>WebApplication</c>, because FastEndpoints maps routes through one.</summary>
    private static async Task<(WebApplication Host, HttpClient Client, InMemoryAnalyticsWindow Window)>
        StartAsync()
    {
        InMemoryAnalyticsWindow window = new();

        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseTestServer();
        builder.Logging.ClearProviders();

        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddSingleton<IInteractionCatalogue, InteractionCatalogue>();
        builder.Services.AddSingleton<IAnalyticsRecorder>(window);
        builder.Services.AddSingleton<IViewStore>(new FakeViewStore());
        builder.Services.AddSingleton<IVisitorCountry>(new FakeVisitorCountry());

        // Every endpoint in the assembly is mapped, so the wake endpoint needs what it takes.
        // With no key configured it answers 404 and nothing here reaches it.
        builder.Services.AddSingleton<IDigestDispatcher>(new FakeDigestDispatcher());
        builder.Services.AddSingleton<IDigestScheduleFactory, DigestScheduleFactory>();
        builder.Services.AddSingleton(Options.Create(new AnalyticsDiagnosticsOptions()));
        builder.Services.AddFastEndpoints(
            options => options.Assemblies = [typeof(PostInteractionsEndpoint).Assembly]);

        WebApplication app = builder.Build();
        app.UseFastEndpoints(
            config => config.Serializer.Options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

        await app.StartAsync();

        return (app, app.GetTestClient(), window);
    }
}
