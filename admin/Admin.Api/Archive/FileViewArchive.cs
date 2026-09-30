namespace Admin.Api.Archive;

using System.Globalization;
using System.Text.Json;
using Admin.Api.Configuration;
using Microsoft.Extensions.Options;

/// <summary>Snapshots as one JSON file a day, beside the usage days.</summary>
public sealed class FileViewArchive : IViewArchive
{
    private const string DayFormat = "yyyy-MM-dd";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
    };

    private readonly string root;

    public FileViewArchive(IOptions<AdminOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);

        this.root = Path.Combine(options.Value.ResolvedDataRoot(), "views");
        Directory.CreateDirectory(this.root);
    }

    public async Task SaveAsync(ViewSnapshot snapshot, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        string path = Path.Combine(
            this.root,
            snapshot.Day.ToString(DayFormat, CultureInfo.InvariantCulture) + ".json");
        string temporary = path + ".writing";

        await File.WriteAllTextAsync(
            temporary, JsonSerializer.Serialize(snapshot, Json), cancellationToken);

        File.Move(temporary, path, overwrite: true);
    }

    public async Task<IReadOnlyList<ViewSnapshot>> ReadAllAsync(CancellationToken cancellationToken)
    {
        List<ViewSnapshot> snapshots = [];

        foreach (string path in Directory.EnumerateFiles(this.root, "*.json").Order(StringComparer.Ordinal))
        {
            try
            {
                string json = await File.ReadAllTextAsync(path, cancellationToken);

                if (JsonSerializer.Deserialize<ViewSnapshot>(json, Json) is { } snapshot)
                {
                    snapshots.Add(snapshot);
                }
            }
            catch (JsonException)
            {
                // One unreadable file is a reason to skip that day, not to lose the history.
            }
        }

        return snapshots;
    }

    public async Task<ViewSnapshot?> LatestAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<ViewSnapshot> all = await this.ReadAllAsync(cancellationToken);

        return all.Count == 0 ? null : all[^1];
    }
}
