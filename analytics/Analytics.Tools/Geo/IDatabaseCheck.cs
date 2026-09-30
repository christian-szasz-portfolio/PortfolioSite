namespace Analytics.Tools.Geo;

/// <summary>Decides whether a freshly unpacked file is a database worth putting in place.</summary>
public interface IDatabaseCheck
{
    /// <summary>Throws <see cref="GeoDatabaseUnusableException"/> when the file is not usable.</summary>
    void Verify(string path);
}
