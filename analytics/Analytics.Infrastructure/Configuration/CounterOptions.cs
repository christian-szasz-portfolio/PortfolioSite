namespace Analytics.Infrastructure.Configuration;

using System.ComponentModel.DataAnnotations;
using Common.Security.RateLimiting;

/// <summary>Everything the counter needs from configuration, validated at startup.</summary>
public sealed class CounterOptions
{
    /// <summary>The configuration section these are bound from. Empty: the settings sit at the root.</summary>
    public const string SectionName = "";

    /// <summary>Connection string for the storage account holding the counter table.</summary>
    [Required(AllowEmptyStrings = false, ErrorMessage = "AzureWebJobsStorage is not configured.")]
    public string AzureWebJobsStorage { get; set; } = string.Empty;

    /// <summary>Name of the table the counters live in.</summary>
    [Required(AllowEmptyStrings = false)]
    public string ViewsTableName { get; set; } = "views";

    /// <summary>Where the offline DB-IP database sits, relative to the running host.</summary>
    public string GeoDatabasePath { get; set; } = Path.Combine("Data", "dbip-country-lite.mmdb");

    /// <summary>How long buffered views may wait before being written, when nothing wakes the writer.</summary>
    [Range(typeof(TimeSpan), "00:00:00.100", "00:05:00")]
    public TimeSpan FlushInterval { get; set; } = TimeSpan.FromSeconds(5);

    /// <summary>How many days of usage are kept before the day's rows are deleted.</summary>
    /// <remarks>The privacy notice names this period, so something has to enforce it.</remarks>
    [Range(1, 3650)]
    public int UsageRetentionDays { get; set; } = 30;

    /// <summary>How many wake-up nudges may queue before further ones are dropped.</summary>
    [Range(1, 10000)]
    public int WakeUpQueueLength { get; set; } = 64;

    /// <summary>How many times a write may lose the ETag race before the store gives up.</summary>
    [Range(1, 20)]
    public int MaxWriteAttempts { get; set; } = 5;

    /// <summary>How many requests one caller may make per <see cref="RateLimitWindow"/>.</summary>
    [Range(1, 10000)]
    public int RateLimitPermits { get; set; } = 30;

    /// <summary>The window those permits are counted over.</summary>
    [Range(typeof(TimeSpan), "00:00:01", "01:00:00")]
    public TimeSpan RateLimitWindow { get; set; } = TimeSpan.FromMinutes(1);

    /// <summary>How many requests this instance serves per window across all callers together.</summary>
    [Range(1, 1000000)]
    public int InstanceRateLimitPermits { get; set; } = 600;

    /// <summary>How many distinct callers the limiter may track at once.</summary>
    [Range(1, 1000000)]
    public int MaxTrackedCallers { get; set; } = FixedWindowRateLimiter.DefaultMaxPartitions;

    /// <summary>How many right-hand X-Forwarded-For hops belong to infrastructure you control.</summary>
    [Range(0, 8)]
    public int TrustedProxyCount { get; set; }

    /// <summary>Origins allowed to read a response, comma separated and matched whole.</summary>
    public string AllowedOrigins { get; set; } = string.Empty;
}
