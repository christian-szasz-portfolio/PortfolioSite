namespace Analytics.Infrastructure.Diagnostics;

using Common.Diagnostics.Resolution;

/// <summary>Builds the resolver that sections one digest across all three apps.</summary>
public static class PortfolioDomainResolver
{
    /// <summary>Where this API sections sit. Folder names, so moving a folder moves its section.</summary>
    private static readonly IReadOnlyDictionary<string, int> AnalyticsOrdering = new Dictionary<string, int>(StringComparer.Ordinal)
    {
        ["Middleware"] = 10,
        ["Callers"] = 15,
        ["Http"] = 20,
        ["Endpoints"] = 25,
        ["Views"] = 30,
        ["Interactions"] = 32,
        ["Usage"] = 34,
        ["Retention"] = 36,
        ["Buffering"] = 40,
        ["Tables"] = 50,
        ["Geo"] = 60,
        ["Storage"] = 65,
        ["Resilience"] = 70,
        ["Diagnostics"] = 80,
    };

    /// <summary>Where the assembler demo sections sit: the compile path first, it is the product.</summary>
    private static readonly IReadOnlyDictionary<string, int> Stack86Ordering = new Dictionary<string, int>(StringComparer.Ordinal)
    {
        ["Middleware"] = 10,
        ["Controllers"] = 20,
        ["Compilation"] = 30,
        ["Pipeline"] = 32,
        ["Stages"] = 34,
        ["Providers"] = 36,
        ["Compiler"] = 38,
        ["Languages"] = 40,
        ["Workers"] = 50,
        ["Validation"] = 60,
        ["Security"] = 70,
    };

    /// <summary>Where the board demo sections sit: what a visitor touches first.</summary>
    private static readonly IReadOnlyDictionary<string, int> TasklyOrdering = new Dictionary<string, int>(StringComparer.Ordinal)
    {
        ["Middleware"] = 10,
        ["Headers"] = 12,
        ["Csp"] = 14,
        ["Cors"] = 16,
        ["Endpoints"] = 25,
        ["Demo"] = 30,
        ["Infrastructure"] = 50,
        ["Security"] = 70,
    };

    /// <summary>The three apps, in the order their sections appear in the email.</summary>
    public static CombinedDomainResolver Create()
    {
        return new CombinedDomainResolver(
        [
            new DigestApp(PortfolioApps.Analytics, 1, AnalyticsOrdering),
            new DigestApp(PortfolioApps.Stack86, 2, Stack86Ordering),
            new DigestApp(PortfolioApps.Taskly, 3, TasklyOrdering),
        ]);
    }
}
