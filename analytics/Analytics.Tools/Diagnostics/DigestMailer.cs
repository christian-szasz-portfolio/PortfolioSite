namespace Analytics.Tools.Diagnostics;

using System.Globalization;
using Common.Diagnostics;
using Common.Diagnostics.Composition;
using Common.Diagnostics.Delivery;

/// <summary>Posts a digest through the real transport, so SMTP can be proved before the API runs.</summary>
/// <remarks>
/// Settings come from the environment under the same names the API binds, so whatever works here
/// works there. Nothing is read from a file, because two of these settings are credentials.
/// </remarks>
public static class DigestMailer
{
    /// <summary>The prefix the configuration section takes as an environment variable.</summary>
    private const string Prefix = "Diagnostics__";

    /// <summary>Sends the sample digest, which needs no storage and no captured entries.</summary>
    public static async Task SendSampleAsync(CancellationToken cancellationToken)
    {
        await SendAsync(DigestPreview.Composed(), cancellationToken);
    }

    /// <summary>Where a digest would go, for the line printed before one is sent.</summary>
    public static string Destination()
    {
        DiagnosticsOptions options = FromEnvironment();

        return $"{options.Recipient} through {options.SmtpHost}:{options.SmtpPort.ToString(CultureInfo.InvariantCulture)}";
    }

    /// <summary>What is missing, or empty when the environment holds enough to send.</summary>
    public static IReadOnlyList<string> Missing()
    {
        DiagnosticsOptions options = FromEnvironment();

        List<string> missing = [];

        if (string.IsNullOrWhiteSpace(options.SmtpHost))
        {
            missing.Add($"{Prefix}SmtpHost");
        }

        if (string.IsNullOrWhiteSpace(options.Recipient))
        {
            missing.Add($"{Prefix}Recipient");
        }

        return missing;
    }

    private static async Task SendAsync(LogDigest digest, CancellationToken cancellationToken)
    {
        DiagnosticsOptions options = FromEnvironment();
        IEmailTransport transport = new EmailTransportFactory(
            Microsoft.Extensions.Options.Options.Create(options)).Create();

        await transport.SendAsync(digest, cancellationToken);
    }

    /// <summary>The same settings the API binds, read straight from the environment.</summary>
    private static DiagnosticsOptions FromEnvironment()
    {
        DiagnosticsOptions options = new()
        {
            SmtpHost = Read(nameof(DiagnosticsOptions.SmtpHost)),
            SmtpUser = Read(nameof(DiagnosticsOptions.SmtpUser)),
            SmtpPassword = Read(nameof(DiagnosticsOptions.SmtpPassword)),
            Recipient = Read(nameof(DiagnosticsOptions.Recipient)),
            Sender = Read(nameof(DiagnosticsOptions.Sender)),
        };

        if (int.TryParse(
            Read(nameof(DiagnosticsOptions.SmtpPort)), CultureInfo.InvariantCulture, out int port))
        {
            options.SmtpPort = port;
        }

        if (Enum.TryParse(
            Read(nameof(DiagnosticsOptions.SmtpSecurity)), ignoreCase: true, out SmtpSecurity security))
        {
            options.SmtpSecurity = security;
        }

        return options;
    }

    private static string Read(string name)
    {
        return Environment.GetEnvironmentVariable(Prefix + name) ?? string.Empty;
    }
}
