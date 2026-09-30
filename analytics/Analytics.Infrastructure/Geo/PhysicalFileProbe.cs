namespace Analytics.Infrastructure.Geo;

/// <summary>Looks at the real file system.</summary>
public sealed class PhysicalFileProbe : IFileProbe
{
    public bool Exists(string path)
    {
        return File.Exists(path);
    }
}
