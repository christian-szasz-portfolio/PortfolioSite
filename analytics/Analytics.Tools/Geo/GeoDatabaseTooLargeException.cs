namespace Analytics.Tools.Geo;

/// <summary>The archive kept expanding past the ceiling, so unpacking was abandoned.</summary>
public sealed class GeoDatabaseTooLargeException(long limitBytes)
    : GeoDatabaseException(
        $"The database unpacked past {limitBytes / 1024 / 1024} MB, so it is not what DB-IP publishes.")
{
    /// <summary>The ceiling that was passed, in bytes.</summary>
    public long LimitBytes { get; } = limitBytes;
}
