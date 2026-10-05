namespace Admin.Tests.Health;

using System.Net;
using System.Text;
using Admin.Api.Configuration;
using Admin.Api.Health;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Xunit;

/// <summary>What the dashboard is told about a host it may not even be able to reach.</summary>
public sealed class HttpHealthProbeTests
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

    private const string DemoReady = """{ "status": "ready", "projects": 2 }""";

    private readonly FakeTimeProvider clock = new();
    private readonly StubHandler handler;

    public HttpHealthProbeTests()
    {
        this.handler = new StubHandler(this.clock);
    }

    [Fact]
    public async Task ReadsTheStatusAndEveryCheck()
    {
        this.handler.Answer(HttpStatusCode.OK, Ready);

        TargetHealth health = await this.Read();

        Assert.True(health.Reachable);
        Assert.Equal(HealthTarget.Api, health.Target);
        Assert.Equal(HealthStatus.Degraded, health.Status);
        Assert.Equal(["storage", "workers"], health.Checks.Select(check => check.Name));
        Assert.Equal(HealthStatus.Healthy, health.Checks[0].Status);
        Assert.Equal("Reachable.", health.Checks[0].Note);
    }

    [Fact]
    public async Task ReadsEveryWorkerOutOfTheChecksPayload()
    {
        this.handler.Answer(HttpStatusCode.OK, Ready);

        TargetHealth health = await this.Read();

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

        TargetHealth health = await this.Read();

        Assert.True(health.Reachable);
        Assert.Equal(2, health.Checks.Count);
    }

    [Fact]
    public async Task ReadsADemoThatIsServingAsHealthyWithItsFigures()
    {
        this.handler.Answer(HttpStatusCode.OK, DemoReady);

        TargetHealth health = await this.Read(HealthTarget.Taskly);

        Assert.True(health.Reachable);
        Assert.Equal(HealthStatus.Healthy, health.Status);
        Assert.Equal("projects 2", Assert.Single(health.Checks).Note);
        Assert.Empty(health.Workers);
    }

    [Fact]
    public async Task ReadsADemoThatSaysAnythingButReadyAsUnhealthy()
    {
        this.handler.Answer(HttpStatusCode.OK, """{ "status": "starting" }""");

        TargetHealth health = await this.Read(HealthTarget.Stack86);

        Assert.Equal(HealthStatus.Unhealthy, health.Status);
        Assert.Equal("starting", Assert.Single(health.Checks).Note);
    }

    /// <summary>A cold start is the number worth seeing, so the round trip is kept.</summary>
    [Fact]
    public async Task KeepsHowLongTheRoundTripTook()
    {
        this.handler.Answer(HttpStatusCode.OK, DemoReady);
        this.handler.Takes = TimeSpan.FromSeconds(48);

        TargetHealth health = await this.Read(HealthTarget.Taskly);

        Assert.Equal(48_000, health.Ms);
    }

    [Fact]
    public async Task AsksEachTargetAtItsOwnAddress()
    {
        this.handler.Answer(HttpStatusCode.OK, DemoReady);

        await this.Read(HealthTarget.Stack86);

        Assert.Equal("https://stack86.example/health/ready", Assert.Single(this.handler.Asked));
    }

    [Fact]
    public async Task SaysSoWhenNoAddressIsConfigured()
    {
        TargetHealth health = await this.Read(url: string.Empty);

        Assert.False(health.Reachable);
        Assert.Equal(HealthStatus.Unknown, health.Status);
        Assert.Empty(this.handler.Asked);
    }

    /// <summary>A host that is asleep or gone is a sentence on the page, not a failed dashboard.</summary>
    [Fact]
    public async Task SaysSoWhenItCannotBeReached()
    {
        this.handler.FailWith = new HttpRequestException("no route to host");

        TargetHealth health = await this.Read();

        Assert.False(health.Reachable);
        Assert.Contains("could not be reached", health.Problem ?? string.Empty, StringComparison.Ordinal);
    }

    [Fact]
    public async Task SaysSoWhenItTakesTooLong()
    {
        this.handler.FailWith = new TaskCanceledException("timed out");

        TargetHealth health = await this.Read(HealthTarget.Taskly);

        Assert.False(health.Reachable);
        Assert.StartsWith("Taskly did not answer in time", health.Problem ?? string.Empty, StringComparison.Ordinal);
    }

    /// <summary>Something that is not this API answers as unreachable rather than throwing.</summary>
    [Theory]
    [InlineData("<html>a login page</html>")]
    [InlineData("\"just a string\"")]
    public async Task SaysSoWhenTheAnswerIsNotWhatItExpects(string body)
    {
        this.handler.Answer(HttpStatusCode.OK, body);

        TargetHealth health = await this.Read();

        Assert.False(health.Reachable);
    }

    [Fact]
    public async Task AsksTheReadinessPathWhateverTrailingSlashTheUrlHas()
    {
        this.handler.Answer(HttpStatusCode.OK, Ready);

        await this.Read(url: "http://localhost:5080/");

        Assert.Equal("http://localhost:5080/health/ready", Assert.Single(this.handler.Asked));
    }

    /// <summary>The default has to outlast a cold start, or every first press reports a timeout.</summary>
    [Fact]
    public void WaitsLongerThanAColdStartByDefault()
    {
        Assert.True(new AdminOptions().HealthTimeout > TimeSpan.FromSeconds(60));
    }

    private Task<TargetHealth> Read(HealthTarget target = HealthTarget.Api, string? url = null)
    {
        AdminOptions options = new()
        {
            AnalyticsApiUrl = target == HealthTarget.Api && url is not null ? url : "http://localhost:5080",
            TasklyUrl = target == HealthTarget.Taskly && url is not null ? url : "https://taskly.example",
            Stack86Url = target == HealthTarget.Stack86 && url is not null ? url : "https://stack86.example",
        };

        HttpHealthProbe probe = new(new HttpClient(this.handler), Options.Create(options), this.clock);

        return probe.ReadAsync(target, CancellationToken.None);
    }

    /// <summary>Answers whatever a test says, and records what it was asked for.</summary>
    private sealed class StubHandler(FakeTimeProvider clock) : HttpMessageHandler
    {
        private HttpStatusCode status = HttpStatusCode.OK;
        private string body = "{}";

        public List<string> Asked { get; } = [];

        public Exception? FailWith { get; set; }

        public TimeSpan Takes { get; set; } = TimeSpan.Zero;

        public void Answer(HttpStatusCode code, string content)
        {
            this.status = code;
            this.body = content;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(request);

            clock.Advance(this.Takes);

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
