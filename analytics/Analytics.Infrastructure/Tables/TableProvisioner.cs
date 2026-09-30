namespace Analytics.Infrastructure.Tables;

using Analytics.Infrastructure.Diagnostics.Storage;
using Azure.Data.Tables;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>Creates the tables once at startup, so unreachable storage fails the host loudly.</summary>
public sealed partial class TableProvisioner(
    TableClient counters,
    [FromKeyedServices(DiagnosticsTables.Logs)] TableClient logs,
    ILogger<TableProvisioner> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // Failure is deliberately not caught: an unreachable storage account should stop the
        // host rather than let it serve a counter that can never persist anything. What is
        // worth a line is the success, so a healthy start says which tables it is using.
        await counters.CreateIfNotExistsAsync(cancellationToken);
        await logs.CreateIfNotExistsAsync(cancellationToken);

        TablesReady(logger, counters.Name, logs.Name);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    // Source generated, so the arguments are not touched when Information is switched off. CA1873
    // asks for that on anything below Warning that takes one.
    [LoggerMessage(Level = LogLevel.Information, Message = "Tables {Counters} and {Logs} are ready.")]
    private static partial void TablesReady(ILogger logger, string counters, string logs);
}
