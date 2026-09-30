namespace Admin.Api.Archive;

using System.Globalization;
using System.Text.Json;
using Admin.Api.Configuration;
using Microsoft.Extensions.Options;

/// <summary>The archive as one JSON file per day, in a folder on this machine.</summary>
/// <remarks>A file per day, written to a temporary file and moved into place.</remarks>
public sealed class FileUsageArchive : IUsageArchive
{
    private const string DayFormat = "yyyy-MM-dd";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
    };

    private readonly string root;

    public FileUsageArchive(IOptions<AdminOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);

        this.root = Path.Combine(options.Value.ResolvedDataRoot(), "usage");
        Directory.CreateDirectory(this.root);
    }

    public string Location => this.root;

    public async Task SaveAsync(UsageDay day, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(day);

        string path = this.PathFor(day.Day);
        string temporary = path + ".writing";

        await File.WriteAllTextAsync(
            temporary, JsonSerializer.Serialize(day, Json), cancellationToken);

        File.Move(temporary, path, overwrite: true);
    }

    public async Task<IReadOnlyList<UsageDay>> ReadAsync(
        DateOnly from, DateOnly to, CancellationToken cancellationToken)
    {
        List<UsageDay> days = [];

        for (DateOnly day = from; day <= to; day = day.AddDays(1))
        {
            if (await this.TryReadAsync(day, cancellationToken) is { } archived)
            {
                days.Add(archived);
            }
        }

        return days;
    }

    public async Task<IReadOnlyList<UsageDay>> ReadAllAsync(CancellationToken cancellationToken)
    {
        List<UsageDay> days = [];

        foreach (string path in Directory.EnumerateFiles(this.root, "*.json").Order(StringComparer.Ordinal))
        {
            if (await ReadFileAsync(path, cancellationToken) is { } archived)
            {
                days.Add(archived);
            }
        }

        return days;
    }

    private async Task<UsageDay?> TryReadAsync(DateOnly day, CancellationToken cancellationToken)
    {
        string path = this.PathFor(day);

        return File.Exists(path) ? await ReadFileAsync(path, cancellationToken) : null;
    }

    /// <summary>One file, or null when it cannot be read as a day, so one bad file skips one day.</summary>
    private static async Task<UsageDay?> ReadFileAsync(string path, CancellationToken cancellationToken)
    {
        try
        {
            string json = await File.ReadAllTextAsync(path, cancellationToken);

            return JsonSerializer.Deserialize<UsageDay>(json, Json);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private string PathFor(DateOnly day)
    {
        return Path.Combine(this.root, day.ToString(DayFormat, CultureInfo.InvariantCulture) + ".json");
    }
}
