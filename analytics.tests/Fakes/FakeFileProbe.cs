namespace Analytics.Tests.Fakes;

using Analytics.Infrastructure.Geo;

/// <summary>A file system that holds exactly the paths a test says it does.</summary>
public sealed class FakeFileProbe(params string[] present) : IFileProbe
{
    private readonly HashSet<string> present = new(present, StringComparer.OrdinalIgnoreCase);

    /// <summary>Every path the factory asked about, so a test can assert where it looked.</summary>
    public List<string> Asked { get; } = [];

    public bool Exists(string path)
    {
        this.Asked.Add(path);
        return this.present.Contains(path);
    }
}
