namespace Analytics.Tests.Api.Endpoints.Diagnostics;

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Analytics.Api.Endpoints.Diagnostics;
using Analytics.Api.Http.Callers;
using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Catalogue;
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
using Microsoft.Extensions.Time.Testing;
using Xunit;

/// <summary>The door a scheduler knocks on when no worker is awake to wait for nine o'clock.</summary>
public sealed class PostDigestEndpointTests
{
    private const string Key = "a-long-enough-shared-secret";

    /// <summary>07:00 UTC is 10:00 in Bucharest in September, so the hour has come round.</summary>
    private static readonly DateTimeOffset AfterNine = new(2026, 9, 10, 7, 0, 0, TimeSpan.Zero);

    /// <summary>04:00 UTC is 07:00 there, which is what a plain UTC cron fires at half the year.</summary>
    private static readonly DateTimeOffset BeforeNine = new(2026, 9, 10, 4, 0, 0, TimeSpan.Zero);

    private readonly FakeDigestDispatcher dispatcher = new();

    /// <summary>Nothing configured is nothing to find, so a caller learns nothing from the path.</summary>
    [Fact]
    public async Task IsNotThereWhenNoKeyIsConfigured()
    {
        using HttpResponseMessage response = await this.CallAsync(AfterNine, key: string.Empty, sent: Key);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(this.dispatcher.Asked);
    }

    [Fact]
    public async Task RefusesACallerWithNoKey()
    {
        using HttpResponseMessage response = await this.CallAsync(AfterNine, Key, sent: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(this.dispatcher.Asked);
    }

    [Fact]
    public async Task RefusesACallerWithTheWrongKey()
    {
        using HttpResponseMessage response = await this.CallAsync(AfterNine, Key, sent: "not-the-key");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(this.dispatcher.Asked);
    }

    /// <summary>The hour is decided here, so a caller may fire on a plain UTC cron.</summary>
    [Fact]
    public async Task SendsNothingBeforeTheHourHasComeRound()
    {
        using HttpResponseMessage response = await this.CallAsync(BeforeNine, Key, Key);

        Assert.Equal("NotDue", await Outcome(response));
        Assert.Empty(this.dispatcher.Asked);
    }

    [Fact]
    public async Task SendsTheDayThatEndedOnceTheHourHasCome()
    {
        using HttpResponseMessage response = await this.CallAsync(AfterNine, Key, Key);

        Assert.Equal("Sent", await Outcome(response));
        Assert.Equal(new DateOnly(2026, 9, 9), Assert.Single(this.dispatcher.Asked));
    }

    /// <summary>For a person checking it by hand rather than waiting until tomorrow.</summary>
    [Fact]
    public async Task SendsBeforeTheHourWhenItIsForced()
    {
        using HttpResponseMessage response = await this.CallAsync(BeforeNine, Key, Key, forced: true);

        Assert.Equal("Sent", await Outcome(response));
        Assert.Single(this.dispatcher.Asked);
    }

    /// <summary>A second caller is told what happened rather than sending a second email.</summary>
    [Fact]
    public async Task SaysWhenTheDayWasAlreadySent()
    {
        this.dispatcher.Outcome = DigestOutcome.AlreadySent;

        using HttpResponseMessage response = await this.CallAsync(AfterNine, Key, Key);

        Assert.Equal("AlreadySent", await Outcome(response));
    }

    private static async Task<string?> Outcome(HttpResponseMessage response)
    {
        JsonElement body = await response.Content.ReadFromJsonAsync<JsonElement>();

        return body.GetProperty("outcome").GetString();
    }

    private async Task<HttpResponseMessage> CallAsync(
        DateTimeOffset now, string key, string? sent, bool forced = false)
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseTestServer();
        builder.Logging.ClearProviders();

        builder.Services.AddSingleton<TimeProvider>(new FakeTimeProvider(now));

        // Every endpoint in the assembly is mapped, so the counter's own need what they take.
        builder.Services.AddSingleton<IViewStore>(new FakeViewStore());
        builder.Services.AddSingleton<IVisitorCountry>(new FakeVisitorCountry());
        builder.Services.AddSingleton<IExcludedCallers>(new FakeExcludedCallers());
        builder.Services.AddSingleton<IInteractionCatalogue, InteractionCatalogue>();
        builder.Services.AddSingleton<IAnalyticsRecorder>(new InMemoryAnalyticsWindow());
        builder.Services.AddSingleton<IDigestDispatcher>(this.dispatcher);
        builder.Services.AddSingleton<IDigestScheduleFactory, DigestScheduleFactory>();
        builder.Services.AddSingleton(Options.Create(new AnalyticsDiagnosticsOptions { TriggerKey = key }));
        builder.Services.AddFastEndpoints(
            options => options.Assemblies = [typeof(PostDigestEndpoint).Assembly]);

        WebApplication app = builder.Build();
        app.UseFastEndpoints(
            config => config.Serializer.Options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

        await app.StartAsync();

        using (app)
        {
            string path = forced
                ? $"{PostDigestEndpoint.Path}?{PostDigestEndpoint.ForceQuery}"
                : PostDigestEndpoint.Path;

            using HttpRequestMessage request = new(HttpMethod.Post, new Uri(path, UriKind.Relative));

            if (sent is not null)
            {
                request.Headers.Add(PostDigestEndpoint.KeyHeader, sent);
            }

            return await app.GetTestClient().SendAsync(request, CancellationToken.None);
        }
    }
}
