namespace Analytics.Domain.Usage.Models;

/// <summary>What the page was used for over one digest window.</summary>
/// <remarks>Built through the named factory, so an empty window is a thing rather than zeroes.</remarks>
public sealed class AnalyticsSummary
{
    private AnalyticsSummary(int views, IReadOnlyList<OperationCount> operations, int rejected)
    {
        this.Views = views;
        this.Operations = operations;
        this.Rejected = rejected;
    }

    /// <summary>A window in which the page was not used at all.</summary>
    public static AnalyticsSummary Empty { get; } = new(0, [], 0);

    /// <summary>Views recorded through the API in this window.</summary>
    public int Views { get; }

    /// <summary>Every counted operation, most used first.</summary>
    public IReadOnlyList<OperationCount> Operations { get; }

    /// <summary>Interactions refused because the API did not recognise the kind.</summary>
    public int Rejected { get; }

    /// <summary>Every counted interaction, whatever kind.</summary>
    public int Interactions => this.Operations.Sum(operation => operation.Count);

    /// <summary>Whether anything happened worth telling anybody about.</summary>
    public bool HasAnything => this.Views > 0 || this.Operations.Count > 0 || this.Rejected > 0;

    /// <summary>A window with something in it. Operations come back most used first.</summary>
    public static AnalyticsSummary Of(
        int views, IReadOnlyList<OperationCount> operations, int rejected)
    {
        ArgumentNullException.ThrowIfNull(operations);

        List<OperationCount> ordered =
        [
            .. operations
                .Where(operation => operation.Count > 0)
                .OrderByDescending(operation => operation.Count)
                .ThenBy(operation => operation.Kind.Order)
                .ThenBy(operation => operation.Kind.Name, StringComparer.Ordinal),
        ];

        return new AnalyticsSummary(views, ordered, rejected);
    }
}
