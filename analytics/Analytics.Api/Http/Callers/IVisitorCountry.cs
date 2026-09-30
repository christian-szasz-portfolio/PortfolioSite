namespace Analytics.Api.Http.Callers;

/// <summary>Works out which country a request came from.</summary>
public interface IVisitorCountry
{
    /// <summary>The caller's country, taken from the raw header so it can be tested without a host.</summary>
    string Resolve(string? forwardedFor);
}
