namespace Analytics.Tools.Security;

using System.Net;

/// <summary>Checks the running API for the guarantees its middleware claims to make.</summary>
public sealed class SecurityProbe(HttpClient http, Uri endpoint)
{
    /// <summary>An origin that must never be allowed, whatever the allowlist holds.</summary>
    private const string HostileOrigin = "https://not-the-site.example";

    /// <summary>Only over HTTPS, because that is the only place the host sends it or a browser reads it.</summary>
    private const string Hsts = "Strict-Transport-Security";

    /// <summary>Headers that must be on every response, refusals included.</summary>
    private static readonly string[] Required =
    [
        "Content-Security-Policy",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Cross-Origin-Opener-Policy",
        "Cross-Origin-Resource-Policy",
        "Cache-Control",
    ];

    /// <summary>Runs every check and reports what each one saw.</summary>
    public async Task<IReadOnlyList<ProbeResult>> RunAsync(CancellationToken cancellationToken)
    {
        return
        [
            await this.HeadersOnASuccessAsync(cancellationToken),
            await this.HeadersOnARefusalAsync(cancellationToken),
            await this.ForgedForwardedForBuysNothingAsync(cancellationToken),
            await this.PreflightIsReachableAsync(cancellationToken),
            await this.HostileOriginIsRefusedAsync(cancellationToken),
            await this.UnsupportedMethodsAreRefusedAsync(cancellationToken),
            await this.HttpsIsPinnedAsync(cancellationToken),
        ];
    }

    /// <summary>The headers this response did not carry, collected by enumerating rather than asking.</summary>
    private static string Missing(HttpResponseMessage response)
    {
        HashSet<string> present = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, IEnumerable<string>> header in response.Headers)
        {
            present.Add(header.Key);
        }

        foreach (KeyValuePair<string, IEnumerable<string>> header in response.Content.Headers)
        {
            present.Add(header.Key);
        }

        return string.Join(", ", Required.Where(name => !present.Contains(name)));
    }

    private async Task<ProbeResult> HeadersOnASuccessAsync(CancellationToken cancellationToken)
    {
        const string Name = "Every header is on a normal response";

        using HttpResponseMessage response = await this.GetAsync(Caller(), null, cancellationToken);
        string missing = Missing(response);

        return missing.Length == 0
            ? ProbeResult.Pass(Name, $"{(int)response.StatusCode} carried all of: {string.Join(", ", Required)}")
            : ProbeResult.Fail(Name, $"{(int)response.StatusCode} was missing: {missing}");
    }

    /// <summary>
    /// The one header that depends on how the caller arrived, so it is checked on its own.
    /// </summary>
    /// <remarks>
    /// Over plain HTTP there is nothing to assert: the host does not send it, and a browser would
    /// ignore it if it did. Probing a local run therefore says so rather than failing.
    /// </remarks>
    private async Task<ProbeResult> HttpsIsPinnedAsync(CancellationToken cancellationToken)
    {
        const string Name = "HTTPS is pinned for a year";

        if (endpoint.Scheme != Uri.UriSchemeHttps)
        {
            return ProbeResult.Pass(Name, $"Skipped: {endpoint.Scheme} has no transport to pin.");
        }

        using HttpResponseMessage response = await this.GetAsync(Caller(), null, cancellationToken);

        if (!response.Headers.TryGetValues(Hsts, out IEnumerable<string>? sent))
        {
            return ProbeResult.Fail(Name, $"{(int)response.StatusCode} carried no {Hsts}.");
        }

        string value = string.Join(", ", sent);

        return value.Contains("max-age=", StringComparison.OrdinalIgnoreCase)
            ? ProbeResult.Pass(Name, $"{Hsts}: {value}")
            : ProbeResult.Fail(Name, $"{Hsts} carried no max-age: {value}");
    }

    private async Task<ProbeResult> HeadersOnARefusalAsync(CancellationToken cancellationToken)
    {
        const string Name = "A rate limited refusal carries them too";

        using HttpResponseMessage? refusal =
            await this.SpendAllowanceAsync(Caller(), varyForgedPrefix: false, cancellationToken);

        if (refusal is null)
        {
            return ProbeResult.Fail(Name, "The limiter never refused, so nothing could be checked.");
        }

        string missing = Missing(refusal);
        bool retryAfter = refusal.Headers.Contains("Retry-After");

        if (missing.Length > 0)
        {
            return ProbeResult.Fail(Name, $"429 was missing: {missing}");
        }

        return retryAfter
            ? ProbeResult.Pass(Name, "429 carried every header and a Retry-After.")
            : ProbeResult.Fail(Name, "429 carried the headers but no Retry-After.");
    }

    /// <summary>The bypass this exists to catch: a forged forwarded prefix taking a fresh allowance.</summary>
    private async Task<ProbeResult> ForgedForwardedForBuysNothingAsync(CancellationToken cancellationToken)
    {
        const string Name = "A forged forwarded prefix buys no fresh allowance";

        using HttpResponseMessage? refusal =
            await this.SpendAllowanceAsync(Caller(), varyForgedPrefix: true, cancellationToken);

        return refusal is not null
            ? ProbeResult.Pass(Name, "Requests with differing forged prefixes shared one bucket and were refused.")
            : ProbeResult.Fail(Name, "Every forged prefix was served, so each one took its own allowance.");
    }

    private async Task<ProbeResult> PreflightIsReachableAsync(CancellationToken cancellationToken)
    {
        const string Name = "Preflight reaches the middleware";

        using HttpRequestMessage request = new(HttpMethod.Options, endpoint);
        request.Headers.Add("Origin", HostileOrigin);
        request.Headers.Add("Access-Control-Request-Method", "POST");

        using HttpResponseMessage response = await http.SendAsync(request, cancellationToken);

        // A 404 means the host refused it by method before the worker pipeline ever ran.
        return response.StatusCode == HttpStatusCode.NotFound
            ? ProbeResult.Fail(Name, "OPTIONS answered 404: no trigger declares it, so the middleware never sees it.")
            : ProbeResult.Pass(Name, $"OPTIONS answered {(int)response.StatusCode}.");
    }

    private async Task<ProbeResult> HostileOriginIsRefusedAsync(CancellationToken cancellationToken)
    {
        const string Name = "An origin off the allowlist is given no permission";

        using HttpResponseMessage response = await this.GetAsync(Caller(), HostileOrigin, cancellationToken);

        if (!response.Headers.TryGetValues("Access-Control-Allow-Origin", out IEnumerable<string>? allowed))
        {
            return ProbeResult.Pass(Name, $"{HostileOrigin} got no Access-Control-Allow-Origin.");
        }

        return ProbeResult.Fail(Name, $"{HostileOrigin} was told: {string.Join(", ", allowed)}");
    }

    private async Task<ProbeResult> UnsupportedMethodsAreRefusedAsync(CancellationToken cancellationToken)
    {
        const string Name = "Methods the counter does not answer are refused";

        List<string> served = [];

        foreach (HttpMethod method in new[] { HttpMethod.Put, HttpMethod.Delete, HttpMethod.Patch })
        {
            using HttpRequestMessage request = new(method, endpoint);
            using HttpResponseMessage response = await http.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                served.Add(method.Method);
            }
        }

        return served.Count == 0
            ? ProbeResult.Pass(Name, "PUT, DELETE and PATCH were all refused.")
            : ProbeResult.Fail(Name, $"Served: {string.Join(", ", served)}");
    }

    /// <summary>Spends requests until one is refused, or gives up.</summary>
    private async Task<HttpResponseMessage?> SpendAllowanceAsync(
        string real, bool varyForgedPrefix, CancellationToken cancellationToken)
    {
        const int Attempts = 40;

        for (int attempt = 0; attempt < Attempts; attempt++)
        {
            string header = varyForgedPrefix
                ? $"10.{attempt}.{attempt}.{attempt}, {real}"
                : real;

            HttpResponseMessage response = await this.GetAsync(header, null, cancellationToken);

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                return response;
            }

            response.Dispose();
        }

        return null;
    }

    private async Task<HttpResponseMessage> GetAsync(
        string forwardedFor, string? origin, CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = new(HttpMethod.Get, endpoint);
        request.Headers.Add("X-Forwarded-For", forwardedFor);

        if (origin is not null)
        {
            request.Headers.Add("Origin", origin);
        }

        return await http.SendAsync(request, cancellationToken);
    }

    /// <summary>A caller nothing else in this run uses, so allowances never overlap.</summary>
    private static string Caller()
    {
        return $"198.51.100.{Random.Shared.Next(1, 255)}";
    }
}
