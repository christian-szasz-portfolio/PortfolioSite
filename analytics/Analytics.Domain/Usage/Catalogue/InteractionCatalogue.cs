namespace Analytics.Domain.Usage.Catalogue;

using Analytics.Domain.Usage.Abstractions;
using Analytics.Domain.Usage.Models;

/// <summary>Everything the page is allowed to tell the API it did.</summary>
/// <remarks>Meant to be edited: one entry here and one call from the page counts something new.</remarks>
public sealed class InteractionCatalogue : IInteractionCatalogue
{
    /// <summary>A reader moved to another page.</summary>
    public static readonly InteractionKind Route =
        InteractionKind.Named("route", "Page opened", 10);

    /// <summary>A reader scrolled far enough for the address to name a new section.</summary>
    public static readonly InteractionKind Section =
        InteractionKind.Named("section", "Section reached", 20);

    /// <summary>The CV was opened in the viewer.</summary>
    public static readonly InteractionKind CvOpened =
        InteractionKind.Named("cv.open", "CV opened", 30);

    /// <summary>The CV was downloaded as a PDF.</summary>
    public static readonly InteractionKind CvPdf =
        InteractionKind.Named("cv.download.pdf", "CV downloaded as PDF", 40);

    /// <summary>The CV source was downloaded as an archive.</summary>
    public static readonly InteractionKind CvSource =
        InteractionKind.Named("cv.download.source", "CV source downloaded", 50);

    /// <summary>A project was opened from its card.</summary>
    public static readonly InteractionKind ProjectRead =
        InteractionKind.Named("project.read", "Project opened", 60);

    private readonly Dictionary<string, InteractionKind> byName;

    public InteractionCatalogue()
        : this([Route, Section, CvOpened, CvPdf, CvSource, ProjectRead])
    {
    }

    /// <summary>The catalogue over a given set, so a test can drive one it controls.</summary>
    public InteractionCatalogue(IReadOnlyList<InteractionKind> kinds)
    {
        ArgumentNullException.ThrowIfNull(kinds);

        this.byName = new Dictionary<string, InteractionKind>(StringComparer.Ordinal);

        foreach (InteractionKind kind in kinds)
        {
            if (!this.byName.TryAdd(kind.Name, kind))
            {
                throw new DuplicateInteractionKindException(kind.Name);
            }
        }

        this.Kinds = [.. kinds.OrderBy(kind => kind.Order)];
    }

    public IReadOnlyList<InteractionKind> Kinds { get; }

    public InteractionKind? Resolve(string? name)
    {
        return string.IsNullOrEmpty(name) ? null : this.byName.GetValueOrDefault(name);
    }
}
