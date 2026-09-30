namespace Analytics.Infrastructure.Geo;

/// <summary>Asks whether a file is there. An interface so the factory can be tested both ways.</summary>
public interface IFileProbe
{
    /// <summary>Whether a file exists at the given absolute path.</summary>
    bool Exists(string path);
}
