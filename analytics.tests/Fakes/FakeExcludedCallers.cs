namespace Analytics.Tests.Fakes;

using Analytics.Api.Http.Callers;

/// <summary>Excludes exactly the forwarded header a test names, or nobody.</summary>
public sealed class FakeExcludedCallers(string? address = null) : IExcludedCallers
{
    public bool IsExcluded(string? forwardedFor)
    {
        return address is not null && forwardedFor == address;
    }
}
