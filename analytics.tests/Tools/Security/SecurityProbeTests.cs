namespace Analytics.Tests.Tools.Security;

using System.Net;
using System.Net.Http.Headers;
using Analytics.Tools.Security;
using Xunit;

public sealed class SecurityProbeTests
{
    private static readonly Uri Endpoint = new("http://localhost/api/views");

    [Fact]
    public async Task ReportsAResponseThatCarriesEveryHeader()
    {
        ProbeResult headers = await FirstResultAsync(withHeaders: true);

        Assert.True(headers.Passed);
    }

    // The probe's own first regression: it asked HttpContentHeaders.Contains for a name that
    // belongs to the response collection, which throws. While the headers were present the
    // check short-circuited before reaching it, so the fault only appeared the one time it
    // mattered: a probe that throws where it should report a failure reports nothing at all.
    [Fact]
    public async Task ReportsMissingHeadersRatherThanThrowing()
    {
        ProbeResult headers = await FirstResultAsync(withHeaders: false);

        Assert.False(headers.Passed);
        Assert.Contains("Content-Security-Policy", headers.Detail, StringComparison.Ordinal);
        Assert.Contains("Cache-Control", headers.Detail, StringComparison.Ordinal);
    }

    private static async Task<ProbeResult> FirstResultAsync(bool withHeaders)
    {
        using HttpClient http = new(new StubHandler(withHeaders));
        SecurityProbe probe = new(http, Endpoint);

        IReadOnlyList<ProbeResult> results = await probe.RunAsync(CancellationToken.None);

        return results[0];
    }

    /// <summary>Answers 200 to everything, with or without the headers under test.</summary>
    private sealed class StubHandler(bool withHeaders) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            HttpResponseMessage response = new(HttpStatusCode.OK)
            {
                Content = new StringContent("{}"),
            };

            if (withHeaders)
            {
                response.Headers.Add("Content-Security-Policy", "default-src 'none'");
                response.Headers.Add("X-Content-Type-Options", "nosniff");
                response.Headers.Add("Referrer-Policy", "no-referrer");
                response.Headers.Add("Permissions-Policy", "camera=()");
                response.Headers.Add("Cross-Origin-Opener-Policy", "same-origin");
                response.Headers.Add("Cross-Origin-Resource-Policy", "same-origin");
                response.Headers.CacheControl = new CacheControlHeaderValue { NoStore = true };
            }

            return Task.FromResult(response);
        }
    }
}
