namespace Analytics.Tools.Geo;

/// <summary>What was downloaded is not a country database this code can read.</summary>
public sealed class GeoDatabaseUnusableException(string message, Exception? inner = null)
    : GeoDatabaseException(message, inner);
