namespace Analytics.Api.Http.Callers;

/// <summary>Decides whether a request comes from an address whose visits are not counted.</summary>
public interface IExcludedCallers
{
    /// <summary>True when the caller in this forwarded header is on the excluded list.</summary>
    bool IsExcluded(string? forwardedFor);
}
