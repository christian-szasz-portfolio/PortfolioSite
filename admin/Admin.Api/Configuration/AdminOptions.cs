namespace Admin.Api.Configuration;

using System.ComponentModel.DataAnnotations;

/// <summary>What the admin tool needs to know: where to read from, and where to keep it.</summary>
public sealed class AdminOptions
{
    /// <summary>The section these are bound from.</summary>
    public const string SectionName = "Admin";

    /// <summary>The analytics storage account as a connection string, which is a secret.</summary>
    [Required]
    public string AzureWebJobsStorage { get; set; } = "UseDevelopmentStorage=true";

    /// <summary>The table the analytics API writes.</summary>
    [Required]
    public string ViewsTableName { get; set; } = "views";

    /// <summary>Where the archive lives on this machine; empty means local application data.</summary>
    public string DataRoot { get; set; } = string.Empty;

    /// <summary>Where the analytics API answers, for the health panel. Empty turns the panel off.</summary>
    /// <remarks>Its own address rather than the storage account, because heartbeats live in a process.</remarks>
    public string AnalyticsApiUrl { get; set; } = string.Empty;

    /// <summary>How long to wait for it, which has to cover a sleeping host starting up.</summary>
    [Range(typeof(TimeSpan), "00:00:01", "00:02:00")]
    public TimeSpan AnalyticsApiTimeout { get; set; } = TimeSpan.FromSeconds(20);

    /// <summary>How many days a sync asks the API's storage for.</summary>
    [Range(1, 400)]
    public int SyncDays { get; set; } = 30;

    /// <summary>Whether the connection string names the local emulator rather than a real account.</summary>
    /// <remarks>Emulator and production look identical on screen, so which is which must be visible.</remarks>
    public bool UsesEmulator()
    {
        return this.AzureWebJobsStorage.Contains("UseDevelopmentStorage=true", StringComparison.OrdinalIgnoreCase)
            || this.AzureWebJobsStorage.Contains("devstoreaccount1", StringComparison.OrdinalIgnoreCase)
            || this.AzureWebJobsStorage.Contains("127.0.0.1", StringComparison.Ordinal);
    }

    /// <summary>Where the figures come from, in words, for the dashboard to show.</summary>
    /// <remarks>The account name only, because the rest of a connection string is a key.</remarks>
    public string SourceName()
    {
        if (this.UsesEmulator())
        {
            return "Azurite emulator";
        }

        foreach (string part in this.AzureWebJobsStorage.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            if (part.StartsWith("AccountName=", StringComparison.OrdinalIgnoreCase))
            {
                return part["AccountName=".Length..];
            }
        }

        return "Azure storage";
    }

    /// <summary>The folder the archive actually uses, resolved once.</summary>
    public string ResolvedDataRoot()
    {
        if (!string.IsNullOrWhiteSpace(this.DataRoot))
        {
            return this.DataRoot;
        }

        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "analytics-admin");
    }
}
