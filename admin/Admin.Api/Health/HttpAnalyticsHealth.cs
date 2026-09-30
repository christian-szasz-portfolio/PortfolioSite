namespace Admin.Api.Health;

using System.Net.Http.Json;
using System.Text.Json;
using Admin.Api.Configuration;
using Microsoft.Extensions.Options;

/// <summary>Reads the analytics API's readiness over HTTP and reshapes it for the dashboard.</summary>
/// <remarks>
/// The one thing in this tool that leaves the machine on a read. Everything else on the dashboard
/// comes off the local archive, and heartbeats cannot: they are what a running process knows about
/// itself, so there is nowhere else to ask.
/// </remarks>
public sealed class HttpAnalyticsHealth(HttpClient http, IOptions<AdminOptions> options)
    : IAnalyticsHealth
{
    /// <summary>Where the analytics API answers readiness.</summary>
    public const string ReadyPath = "health/ready";

    /// <summary>The check that carries the heartbeats, named the same as it is over there.</summary>
    private const string WorkersCheck = "workers";

    public async Task<AnalyticsHealth> ReadAsync(CancellationToken cancellationToken)
    {
        string root = options.Value.AnalyticsApiUrl;

        if (string.IsNullOrWhiteSpace(root))
        {
            return AnalyticsHealth.Unreachable("No analytics API is configured for this run.");
        }

        try
        {
            Uri address = new(new Uri(root.TrimEnd('/') + "/"), ReadyPath);

            using HttpResponseMessage response = await http.GetAsync(address, cancellationToken);

            // 503 is an answer, not a failure: it is what unhealthy looks like, and the body
            // still says which check said so.
            JsonElement body = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);

            return Read(body);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            // A sleeping host, a wrong address, or something that is not this API. All three are
            // worth saying plainly rather than failing the page that asked.
            return AnalyticsHealth.Unreachable(Describe(ex));
        }
    }

    private static AnalyticsHealth Read(JsonElement body)
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
                    Text(entry, "status") ?? "Unknown",
                    Text(entry, "note"),
                    entry.TryGetProperty("ms", out JsonElement ms) && ms.TryGetInt64(out long took) ? took : 0));

                if (string.Equals(name, WorkersCheck, StringComparison.Ordinal))
                {
                    workers.AddRange(Beats(entry));
                }
            }
        }

        return new AnalyticsHealth(
            true,
            null,
            Text(body, "status") ?? "Unknown",
            checks,
            [.. workers.OrderBy(worker => worker.Name, StringComparer.Ordinal)]);
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

    private static string Describe(Exception ex)
    {
        return ex is TaskCanceledException
            ? "The analytics API did not answer in time. A sleeping host takes a moment to start."
            : $"The analytics API could not be reached: {ex.GetType().Name}.";
    }
}
