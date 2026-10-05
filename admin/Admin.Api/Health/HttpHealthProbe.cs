namespace Admin.Api.Health;

using System.Net.Http.Json;
using System.Text.Json;
using Admin.Api.Configuration;
using Microsoft.Extensions.Options;

/// <summary>Reads a deployed service's readiness over HTTP and reshapes it for the dashboard.</summary>
/// <remarks>
/// The one thing in this tool that leaves the machine on a read. Everything else on the dashboard
/// comes off the local archive, and heartbeats cannot: they are what a running process knows about
/// itself, so there is nowhere else to ask.
/// </remarks>
public sealed class HttpHealthProbe(HttpClient http, IOptions<AdminOptions> options, TimeProvider clock)
    : IHealthProbe
{
    /// <summary>Where every target answers readiness.</summary>
    public const string ReadyPath = "health/ready";

    /// <summary>The analytics check that carries the heartbeats, named the same as it is over there.</summary>
    private const string WorkersCheck = "workers";

    /// <summary>What a demo's readiness says when it is serving.</summary>
    private const string DemoReady = "ready";

    public async Task<TargetHealth> ReadAsync(HealthTarget target, CancellationToken cancellationToken)
    {
        string root = options.Value.UrlFor(target);

        if (string.IsNullOrWhiteSpace(root))
        {
            return TargetHealth.Unreachable(target, $"{Name(target)} has no address configured in this run.");
        }

        long started = clock.GetTimestamp();

        try
        {
            Uri address = new(new Uri(root.TrimEnd('/') + "/"), ReadyPath);

            using HttpResponseMessage response = await http.GetAsync(address, cancellationToken);

            // 503 is an answer, not a failure: it is what unhealthy looks like, and the body
            // still says which check said so.
            JsonElement body = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            long ms = this.Elapsed(started);

            if (body.ValueKind != JsonValueKind.Object)
            {
                return TargetHealth.Unreachable(target, $"{Name(target)} answered with something that is not a health report.", ms);
            }

            return body.TryGetProperty("checks", out _)
                ? ReadChecks(target, body, ms)
                : ReadDemo(target, body, ms);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            // A sleeping host, a wrong address, or something that is not this service. All three
            // are worth saying plainly rather than failing the page that asked.
            return TargetHealth.Unreachable(target, Describe(target, ex), this.Elapsed(started));
        }
    }

    /// <summary>The service's name as a sentence starts it.</summary>
    public static string Name(HealthTarget target)
    {
        return target switch
        {
            HealthTarget.Api => "The analytics API",
            HealthTarget.Taskly => "Taskly",
            HealthTarget.Stack86 => "Stack86",
            _ => throw new ArgumentOutOfRangeException(nameof(target), target, null),
        };
    }

    private long Elapsed(long started)
    {
        return (long)clock.GetElapsedTime(started).TotalMilliseconds;
    }

    /// <summary>The analytics API's report: an overall status, then one entry per check.</summary>
    private static TargetHealth ReadChecks(HealthTarget target, JsonElement body, long ms)
    {
        List<HealthLine> checks = [];
        List<WorkerLine> workers = [];

        if (body.TryGetProperty("checks", out JsonElement entries)
            && entries.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement entry in entries.EnumerateArray())
            {
                string name = Text(entry, "name") ?? string.Empty;

                checks.Add(new HealthLine(
                    name,
                    Status(Text(entry, "status")),
                    Text(entry, "note"),
                    Number(entry, "ms")));

                if (string.Equals(name, WorkersCheck, StringComparison.Ordinal))
                {
                    workers.AddRange(Beats(entry));
                }
            }
        }

        return new TargetHealth(
            target,
            true,
            null,
            Status(Text(body, "status")),
            ms,
            checks,
            [.. workers.OrderBy(worker => worker.Name, StringComparer.Ordinal)]);
    }

    /// <summary>A demo's report: ready or not, and whatever figures it adds, as one line.</summary>
    private static TargetHealth ReadDemo(HealthTarget target, JsonElement body, long ms)
    {
        string? said = Text(body, "status");
        HealthStatus status = string.Equals(said, DemoReady, StringComparison.OrdinalIgnoreCase)
            ? HealthStatus.Healthy
            : HealthStatus.Unhealthy;

        string[] figures =
        [
            .. body.EnumerateObject()
                .Where(property => property.Name != "status" && property.Value.ValueKind == JsonValueKind.Number)
                .Select(property => $"{property.Name} {property.Value.GetRawText()}"),
        ];

        string note = figures.Length > 0 ? string.Join(", ", figures) : said ?? "No status given.";

        return new TargetHealth(target, true, null, status, ms, [new HealthLine(DemoReady, status, note, ms)], []);
    }

    /// <summary>The workers check carries one object per worker, keyed by its name.</summary>
    private static IEnumerable<WorkerLine> Beats(JsonElement entry)
    {
        if (!entry.TryGetProperty("data", out JsonElement data)
            || data.ValueKind != JsonValueKind.Object)
        {
            yield break;
        }

        foreach (JsonProperty worker in data.EnumerateObject())
        {
            if (worker.Value.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            bool overdue = worker.Value.TryGetProperty("overdue", out JsonElement flag)
                && flag.ValueKind == JsonValueKind.True;

            yield return new WorkerLine(
                worker.Name,
                Number(worker.Value, "ageSeconds"),
                Number(worker.Value, "periodSeconds"),
                overdue);
        }
    }

    private static HealthStatus Status(string? said)
    {
        return Enum.TryParse(said, ignoreCase: true, out HealthStatus status) && Enum.IsDefined(status)
            ? status
            : HealthStatus.Unknown;
    }

    private static string? Text(JsonElement element, string name)
    {
        return element.TryGetProperty(name, out JsonElement value)
            && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
    }

    private static long Number(JsonElement element, string name)
    {
        return element.TryGetProperty(name, out JsonElement value) && value.TryGetInt64(out long number)
            ? number
            : 0;
    }

    private static string Describe(HealthTarget target, Exception ex)
    {
        return ex is TaskCanceledException
            ? $"{Name(target)} did not answer in time. A sleeping host takes about 50 s to start."
            : $"{Name(target)} could not be reached: {ex.GetType().Name}.";
    }
}
