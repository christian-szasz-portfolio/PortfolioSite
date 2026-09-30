namespace Analytics.Tools.Diagnostics;

using System.Globalization;
using Analytics.Domain.Usage.Catalogue;
using Analytics.Domain.Usage.Models;
using Analytics.Infrastructure.Diagnostics;
using Common.Diagnostics.Capture;
using Common.Diagnostics.Composition;
using Common.Diagnostics.Composition.Sections;
using Common.Diagnostics.Models;

/// <summary>Writes a sample digest to a file, so the email can be seen without a mail server.</summary>
public static class DigestPreview
{
    /// <summary>Composes the sample and returns the HTML.</summary>
    public static string Compose()
    {
        return Composed().Html;
    }

    /// <summary>The whole sample, subject included, for anything that posts it rather than saves it.</summary>
    public static LogDigest Composed()
    {
        DigestComposer composer = new(
            () => new HtmlEmailBuilder(),
            new SectionRendererFactory([new FailureSectionRenderer(), new NoteSectionRenderer()]),
            TimeProvider.System,
            "portfolio");

        return composer.Compose(new DigestWindow(Yesterday(), Sample(), 3, Facts(), ForceSend: true));
    }

    private static IReadOnlyList<DigestFact> Facts()
    {
        AnalyticsSummary counted = Counted();

        return
        [
            new DigestFact("Views", counted.Views.ToString(CultureInfo.InvariantCulture)),
            new DigestFact("Interactions", counted.Interactions.ToString(CultureInfo.InvariantCulture)),
            new DigestFact(
                "Operations",
                string.Join(
                    ", ",
                    counted.Operations.Select(operation =>
                        $"{operation.Kind.Label} {operation.Count.ToString(CultureInfo.InvariantCulture)}"))),
        ];
    }

    /// <summary>The day a real daily digest would report on.</summary>
    private static DateOnly Yesterday()
    {
        return DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);
    }

    /// <summary>A window with some use in it, so the preview shows figures rather than zeroes.</summary>
    private static AnalyticsSummary Counted()
    {
        return AnalyticsSummary.Of(
            views: 128,
            [
                new OperationCount(InteractionCatalogue.Route, 96),
                new OperationCount(InteractionCatalogue.Section, 214),
                new OperationCount(InteractionCatalogue.CvOpened, 31),
                new OperationCount(InteractionCatalogue.CvPdf, 12),
                new OperationCount(InteractionCatalogue.CvSource, 3),
                new OperationCount(InteractionCatalogue.ProjectRead, 47),
            ],
            rejected: 2);
    }

    private static IReadOnlyList<LogEntry> Sample()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        var domains = PortfolioDomainResolver.Create();

        LogEntry Note(string app, string category, LogSeverity severity, string message, int secondsAgo)
        {
            return LogEntry.Note(
                now.AddSeconds(-secondsAgo), severity, domains.Resolve(app, category), category, message);
        }

        LogEntry Failure(string app, string category, string message, int secondsAgo)
        {
            return LogEntry.Failure(
                now.AddSeconds(-secondsAgo),
                LogSeverity.Error,
                domains.Resolve(app, category),
                category,
                message,
                Caught().ToString());
        }

        // All three apps, because one digest now covers all three.
        return
        [
            Note(PortfolioApps.Analytics, "Analytics.Api.Http.Middleware.RateLimitingMiddleware", LogSeverity.Warning, "Rate limited 8F2A for 41s.", 600),
            Note(PortfolioApps.Analytics, "Analytics.Api.Http.Middleware.CorsMiddleware", LogSeverity.Warning, "An origin off the allowlist asked to read a response.", 540),
            Failure(PortfolioApps.Analytics, "Analytics.Domain.Views.TableViewStore", "Gave up incrementing the RO counter after 5 attempts.", 420),
            Note(PortfolioApps.Analytics, "Analytics.Infrastructure.Buffering.ViewFlushService", LogSeverity.Warning, "Could not flush 2 buffered countries; they stay buffered.", 400),
            Note(PortfolioApps.Analytics, "Microsoft.AspNetCore.Hosting.Diagnostics", LogSeverity.Warning, "Request finished in 2841ms.", 380),
            Note(PortfolioApps.Stack86, "Stack86.Api.Controllers.CompilerController", LogSeverity.Warning, "A caller was throttled after 30 compiles in a minute.", 300),
            Failure(PortfolioApps.Stack86, "Stack86.Logic.Compilation.Pipeline.CompilationPipeline", "A compile stage threw and the request answered 500.", 280),
            Note(PortfolioApps.Taskly, "Taskly.Web.Demo.DemoStore", LogSeverity.Warning, "The demo dataset was reseeded mid-session.", 180),
            Failure(PortfolioApps.Taskly, "Taskly.Web.Infrastructure.Security.Csp.NonceWriter", "The built page was missing, so no nonce could be written.", 120),
            Note(PortfolioApps.Taskly, "Microsoft.AspNetCore.Server.Kestrel", LogSeverity.Warning, "A connection was reset before the response was written.", 60),
        ];
    }

    /// <summary>A real throw, so the preview carries a real stack with a real inner exception.</summary>
    private static InvalidOperationException Caught()
    {
        try
        {
            try
            {
                throw new TimeoutException("The storage account did not answer in time.");
            }
            catch (TimeoutException inner)
            {
                throw new InvalidOperationException("Gave up incrementing a counter row.", inner);
            }
        }
        catch (InvalidOperationException caught)
        {
            return caught;
        }
    }
}
