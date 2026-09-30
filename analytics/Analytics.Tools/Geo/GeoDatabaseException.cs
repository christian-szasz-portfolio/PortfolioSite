namespace Analytics.Tools.Geo;

/// <summary>A refresh that produced nothing worth putting in place, leaving the old file untouched.</summary>
public abstract class GeoDatabaseException(string message, Exception? inner = null)
    : Exception(message, inner);
