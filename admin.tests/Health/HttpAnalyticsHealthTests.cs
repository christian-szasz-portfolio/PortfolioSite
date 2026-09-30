namespace Admin.Tests.Health;

using System.Net;
using System.Text;
using Admin.Api.Configuration;
using Admin.Api.Health;
using Microsoft.Extensions.Options;
using Xunit;

/// <summary>What the dashboard is told about a host it may not even be able to reach.</summary>
public sealed class HttpAnalyticsHealthTests
{
    private const string Ready = """
        {
          "status": "Degraded",
          "totalMs": 7,
          "checks": [
            { "name": "storage", "status": "Healthy", "ms": 4, "note": "Reachable.", "data": null },
            {
              "name": "workers",
              "status": "Degraded",
              "ms": 1,
              "note": "Overdue: usage-flush.",
              "data": {
                "views-flush": { "ageSeconds": 2, "periodSeconds": 5, "overdue": false },
                "usage-flush": { "ageSeconds": 600, "periodSeconds": 5, "overdue": true }
              }
            }
          ]
        }
        """;

    private readonly StubHandler handler = new();

    [Fact]
    public async Task ReadsTheStatusAndEveryCheck()
    {
        this.handler.Answer(HttpStatusCode.OK, Ready);

        AnalyticsHealth health = await this.Read();

        Assert.True(health.Reachable);
        Assert.Equal("Degraded", health.Status);
        Assert.Equal(["storage", "workers"], health.Checks.Select(check => check.Name));
        Assert.Equal("Reachable.", health.Checks[0].Note);
    }

    [Fact]
    public async Task ReadsEveryWorkerOutOfTheChecksPayload()
    {
        this.handler.Answer(HttpStatusCode.OK, Ready);

        AnalyticsHealth health = await this.Read();

        Assert.Equal(["usage-flush", "views-flush"], health.Workers.Select(worker => worker.Name));
        Assert.Equal(600, health.Workers[0].AgeSeconds);
        Assert.Equal(5, health.Workers[0].PeriodSeconds);
        Assert.True(health.Workers[0].Overdue);
        Assert.False(health.Workers[1].Overdue);
    }

    /// <summary>503 is what unhealthy looks like, and the body still says which check said so.</summary>
    [Fact]
    public async Task ReadsARefusalAsAnAnswer()
    {
        this.handler.Answer(HttpStatusCode.ServiceUnavailable, Ready);

        AnalyticsHealth health = await this.Read();

        Assert.True(health.Reachable);
        Assert.Equal(2, health.Checks.Count);
    }

    [Fact]
    public async Task SaysSoWhenNoApiIsConfigured()
    {
        AnalyticsHealth health = await this.Read(url: string.Empty);

        Assert.False(health.Reachable);
        Assert.Equal("Unknown", health.Status);
        Assert.Empty(this.handler.Asked);
    }

    /// <summary>A host that is asleep or gone is a sentence on the page, not a failed dashboard.</summary>
    [Fact]
    public async Task SaysSoWhenItCannotBeReached()
    {
        this.handler.FailWith = new HttpRequestException("no route to host");

        AnalyticsHealth health = await this.Read();

        Assert.False(health.Reachable);
        Assert.Contains("could not be reached", health.Problem ?? string.Empty, StringComparison.Ordinal);
    }

    [Fact]
    public async Task SaysSoWhenItTakesTooLong()
    {
        this.handler.FailWith = new TaskCanceledException("timed out");

        AnalyticsHealth health = await this.Read();

        Assert.False(health.Reachable);
        Assert.Contains("in time", health.Problem ?? string.Empty, StringComparison.Ordinal);
    }

    /// <summary>Something that is not this API answers as unreachable rather than throwing.</summary>
    [Fact]
    public async Task SaysSoWhenTheAnswerIsNotWhatItExpects()
    {
        this.handler.Answer(HttpStatusCode.OK, "<html>a login page</html>");

        AnalyticsHealth health = await this.Read();

        Assert.False(health.Reachable);
    }

    [Fact]
    public async Task AsksTheReadinessPathWhateverTrailingSlashTheUrlHas()
    {
        this.handler.Answer(HttpStatusCode.OK, Ready);

        await this.Read(url: "http://localhost:5080/");

        Assert.Equal("http://localhost:5080/health/ready", Assert.Single(this.handler.Asked));
    }

    private Task<AnalyticsHealth> Read(string url = "http://localhost:5080")
    {
        AdminOptions options = new() { AnalyticsApiUrl = url };

        HttpAnalyticsHealth health = new(new HttpClient(this.handler), Options.Create(options));

        return health.ReadAsync(CancellationToken.None);
    }

    /// <summary>Answers whatever a test says, and records what it was asked for.</summary>
    private sealed class StubHandler : HttpMessageHandler
    {
        private HttpStatusCode status = HttpStatusCode.OK;
        private string body = "{}";

        public List<string> Asked { get; } = [];

        public Exception? FailWith { get; set; }

        public void Answer(HttpStatusCode code, string content)
        {
            this.status = code;
            this.body = content;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (this.FailWith is { } failure)
            {
                throw failure;
            }

            this.Asked.Add(request.RequestUri?.ToString() ?? string.Empty);

            return Task.FromResult(new HttpResponseMessage(this.status)
            {
                Content = new StringContent(this.body, Encoding.UTF8, "application/json"),
            });
        }
    }
}
