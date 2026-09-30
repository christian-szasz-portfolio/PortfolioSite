namespace Analytics.Tools;

using System.Globalization;
using Analytics.Tools.Diagnostics;
using Analytics.Tools.Geo;
using Analytics.Tools.Security;
using Azure;
using Common.Diagnostics.Delivery;

// dotnet run --project analytics/Analytics.Tools                         refresh the GeoIP database
// dotnet run --project analytics/Analytics.Tools -- geoip [path]           the same, to a chosen path
// dotnet run --project analytics/Analytics.Tools -- verify [url]           probe a running API
// dotnet run --project analytics/Analytics.Tools -- digest [path]          write a sample log email
// dotnet run --project analytics/Analytics.Tools -- mail                   post that sample over SMTP
// dotnet run --project analytics/Analytics.Tools -- usage [date]           read a stored day of usage
// dotnet run --project analytics/Analytics.Tools -- logs [date]            read a stored day of entries
// dotnet run --project analytics/Analytics.Tools -- export [days] [path]   write those days as CSV
// dotnet run --project analytics/Analytics.Tools -- prune [keep-from]      drop days before a date

/// <summary>Operational tasks for the counter, run from the repository root.</summary>
internal static class Program
{
    /// <summary>Where a locally running host answers.</summary>
    private const string DefaultEndpoint = "http://localhost:5080/api/views";

    /// <summary>Where a locally running host keeps its rows.</summary>
    private const string DefaultStorage = "UseDevelopmentStorage=true";

    /// <summary>The table the API writes, matching the default in appsettings.</summary>
    private const string DefaultTable = "views";

    /// <summary>The table the API keeps captured entries in, matching the default in appsettings.</summary>
    private const string DefaultLogsTable = "logs";

    /// <summary>The whole window the API keeps, so an export with no argument takes all of it.</summary>
    private const int DefaultExportDays = 30;

    /// <summary>Where the API looks for the database, relative to the repository root.</summary>
    private static readonly string DefaultTarget =
        Path.Combine("analytics", "Analytics.Api", "Data", "dbip-country-lite.mmdb");

    private static async Task<int> Main(string[] args)
    {
        string command = args.Length > 0 && !args[0].StartsWith('-') ? args[0] : "geoip";
        string[] rest = args.Length > 0 && command == args[0] ? args[1..] : args;

        return command switch
        {
            "geoip" => await RefreshGeoDatabaseAsync(rest),
            "verify" => await VerifySecurityAsync(rest),
            "digest" => await WriteDigestPreviewAsync(rest),
            "mail" => await SendDigestAsync(),
            "usage" => await ReadUsageAsync(rest),
            "logs" => await ReadLogsAsync(rest),
            "export" => await ExportUsageAsync(rest),
            "prune" => await PruneUsageAsync(rest),
            _ => Unknown(command),
        };
    }

    private static int Unknown(string command)
    {
        Console.Error.WriteLine(
            $"Unknown command '{command}'. "
            + "Expected 'geoip', 'verify', 'digest', 'mail', 'usage', 'logs', 'export' or 'prune'.");

        return 2;
    }

    private static async Task<int> RefreshGeoDatabaseAsync(string[] args)
    {
        string target = args.Length > 0 ? args[0] : DefaultTarget;
        Uri source = DbIpDownloader.UrlFor(DateTime.UtcNow);

        Console.WriteLine($"Downloading {source}");

        using HttpClient http = new();
        DbIpDownloader downloader = new(http, new MaxMindDatabaseCheck());

        try
        {
            long bytes = await downloader.DownloadAsync(source, target, CancellationToken.None);
            string digest = await DbIpDownloader.DigestOfAsync(target, CancellationToken.None);

            Console.WriteLine($"Wrote {Path.GetFullPath(target)} ({bytes / 1024d / 1024d:F1} MB)");
            Console.WriteLine($"SHA-256 {digest}");

            return 0;
        }
        catch (HttpRequestException ex)
        {
            Console.Error.WriteLine($"{source} could not be fetched: {ex.Message}");

            return 1;
        }
        catch (GeoDatabaseException ex)
        {
            // Every one of these leaves the database already in place untouched, because both the
            // size ceiling and the readability check run before the move.
            Console.Error.WriteLine($"Nothing was replaced: {ex.Message}");

            if (ex is GeoDatabaseTooLargeException)
            {
                Console.Error.WriteLine(
                    "That is a size ceiling, not a bad download. Check the source before retrying.");
            }

            return 1;
        }
    }

    /// <summary>Writes the sample digest to a file, because an email cannot be iterated on unseen.</summary>
    private static async Task<int> WriteDigestPreviewAsync(string[] args)
    {
        string target = args.Length > 0 ? args[0] : "digest-preview.html";

        await File.WriteAllTextAsync(target, DigestPreview.Compose(), CancellationToken.None);

        Console.WriteLine($"Wrote {Path.GetFullPath(target)}");
        Console.WriteLine("Open it in a browser, or send it to yourself, before wiring SMTP.");

        return 0;
    }

    /// <summary>Posts the sample through the real transport, which is what proves SMTP works.</summary>
    private static async Task<int> SendDigestAsync()
    {
        IReadOnlyList<string> missing = DigestMailer.Missing();

        if (missing.Count > 0)
        {
            Console.Error.WriteLine($"Nothing was sent: {string.Join(" and ", missing)} are not set.");
            Console.Error.WriteLine("Set them in this shell, then run this again.");

            return 1;
        }

        Console.WriteLine($"Sending the sample digest to {DigestMailer.Destination()}");

        try
        {
            await DigestMailer.SendSampleAsync(CancellationToken.None);

            Console.WriteLine("Sent.");

            return 0;
        }
        catch (DigestDeliveryException ex)
        {
            Console.Error.WriteLine(ex.Message);
            Console.Error.WriteLine(ex.InnerException?.Message ?? "No further detail.");

            return 1;
        }
    }

    /// <summary>Reads a stored day back through the same store the API writes with.</summary>
    private static async Task<int> ReadUsageAsync(string[] args)
    {
        DateOnly day = args.Length > 0 && DateOnly.TryParse(
            args[0], CultureInfo.InvariantCulture, out DateOnly asked)
            ? asked
            : DateOnly.FromDateTime(DateTime.UtcNow);

        string connection = Environment.GetEnvironmentVariable("AzureWebJobsStorage") ?? DefaultStorage;

        try
        {
            IReadOnlyList<string> lines =
                await UsageReport.ReadAsync(connection, DefaultTable, day, CancellationToken.None);

            foreach (string line in lines)
            {
                Console.WriteLine(line);
            }

            return 0;
        }
        catch (RequestFailedException ex)
        {
            Console.Error.WriteLine($"Could not read the table: {ex.Message}");
            Console.Error.WriteLine("Start storage first, e.g. azurite --tablePort 10002.");

            return 1;
        }
    }

    /// <summary>Reads a stored day of entries, which is what the morning's digest will carry.</summary>
    private static async Task<int> ReadLogsAsync(string[] args)
    {
        DateOnly day = args.Length > 0 && DateOnly.TryParse(
            args[0], CultureInfo.InvariantCulture, out DateOnly asked)
            ? asked
            : DateOnly.FromDateTime(DateTime.UtcNow);

        string connection = Environment.GetEnvironmentVariable("AzureWebJobsStorage") ?? DefaultStorage;

        try
        {
            IReadOnlyList<string> lines =
                await LogReport.ReadAsync(connection, DefaultLogsTable, day, CancellationToken.None);

            foreach (string line in lines)
            {
                Console.WriteLine(line);
            }

            return 0;
        }
        catch (RequestFailedException ex)
        {
            Console.Error.WriteLine($"Could not read the table: {ex.Message}");
            Console.Error.WriteLine("Start storage first, e.g. azurite --tablePort 10002.");

            return 1;
        }
    }

    /// <summary>Writes the stored days out as CSV, for anything wanted longer than the window.</summary>
    private static async Task<int> ExportUsageAsync(string[] args)
    {
        int days = args.Length > 0 && int.TryParse(
            args[0], CultureInfo.InvariantCulture, out int asked) && asked > 0
            ? asked
            : DefaultExportDays;

        string target = args.Length > 1 ? args[1] : "usage.csv";
        DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
        string connection = Environment.GetEnvironmentVariable("AzureWebJobsStorage") ?? DefaultStorage;

        try
        {
            string csv = await UsageExport.ToCsvAsync(
                connection, DefaultTable, today.AddDays(-(days - 1)), today, CancellationToken.None);

            await File.WriteAllTextAsync(target, csv, CancellationToken.None);

            Console.WriteLine($"Wrote {days} days to {Path.GetFullPath(target)}");
            Console.WriteLine("Import it into a spreadsheet: one row a day, one column an operation.");

            return 0;
        }
        catch (RequestFailedException ex)
        {
            Console.Error.WriteLine($"Could not read the table: {ex.Message}");
            Console.Error.WriteLine("Start storage first, e.g. azurite --tablePort 10002.");

            return 1;
        }
    }

    /// <summary>Drops stored days before a date, defaulting to the window the host enforces.</summary>
    private static async Task<int> PruneUsageAsync(string[] args)
    {
        DateOnly oldestKept = args.Length > 0 && DateOnly.TryParse(
            args[0], CultureInfo.InvariantCulture, out DateOnly asked)
            ? asked
            : DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-DefaultExportDays);

        string connection = Environment.GetEnvironmentVariable("AzureWebJobsStorage") ?? DefaultStorage;

        try
        {
            int dropped = await UsagePrune.DropBeforeAsync(
                connection, DefaultTable, oldestKept, CancellationToken.None);

            Console.WriteLine(
                $"Dropped {dropped.ToString(CultureInfo.InvariantCulture)} days stored before "
                + $"{oldestKept.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}.");

            return 0;
        }
        catch (RequestFailedException ex)
        {
            Console.Error.WriteLine($"Could not read the table: {ex.Message}");
            Console.Error.WriteLine("Start storage first, e.g. azurite --tablePort 10002.");

            return 1;
        }
    }

    private static async Task<int> VerifySecurityAsync(string[] args)
    {
        Uri endpoint = new(args.Length > 0 ? args[0] : DefaultEndpoint);

        Console.WriteLine($"Probing {endpoint}");
        Console.WriteLine();

        using HttpClient http = new() { Timeout = TimeSpan.FromSeconds(30) };
        SecurityProbe probe = new(http, endpoint);

        IReadOnlyList<ProbeResult> results;
        try
        {
            results = await probe.RunAsync(CancellationToken.None);
        }
        catch (HttpRequestException ex)
        {
            Console.Error.WriteLine($"Nothing answered at {endpoint}: {ex.Message}");
            Console.Error.WriteLine("Start the host first: dotnet run --project analytics/Analytics.Api");

            return 1;
        }

        foreach (ProbeResult result in results)
        {
            Console.WriteLine(result);
        }

        int failed = results.Count(result => !result.Passed);
        Console.WriteLine();
        Console.WriteLine($"{results.Count - failed}/{results.Count} checks passed.");

        return failed == 0 ? 0 : 1;
    }
}
