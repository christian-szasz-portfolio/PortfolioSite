namespace Analytics.Tests.Fakes;

using Analytics.Api.Http.Callers;

/// <summary>Answers with one country, so a test needs no geography database.</summary>
public sealed class FakeVisitorCountry : IVisitorCountry
{
    /// <summary>What every caller resolves to.</summary>
    public string Country { get; set; } = "RO";

    public string Resolve(string? forwardedFor)
    {
        return this.Country;
    }
}
