namespace Analytics.Domain.Usage.Models;

/// <summary>One counted action: what was done, and which thing it was done to.</summary>
/// <remarks>Nothing here identifies a reader, because there is nowhere to put it.</remarks>
public sealed class Interaction
{
    /// <summary>Enough for a route or a slug. Longer than this is not a target, it is a payload.</summary>
    public const int MaxTargetLength = 80;

    private Interaction(InteractionKind kind, string target, DateTimeOffset at)
    {
        this.Kind = kind;
        this.Target = target;
        this.At = at;
    }

    public InteractionKind Kind { get; }

    /// <summary>What it happened to: a route, a project slug, a section. Empty when it needs none.</summary>
    public string Target { get; }

    public DateTimeOffset At { get; }

    /// <summary>A counted action, with the target stripped, trimmed and cut to length.</summary>
    public static Interaction Of(InteractionKind kind, string? target, DateTimeOffset at)
    {
        ArgumentNullException.ThrowIfNull(kind);

        return new Interaction(kind, Clean(target), at);
    }

    /// <summary>Printable characters only, cut to length.</summary>
    private static string Clean(string? target)
    {
        if (string.IsNullOrWhiteSpace(target))
        {
            return string.Empty;
        }

        string printable = new([.. target.Where(character => !char.IsControl(character))]);
        string trimmed = printable.Trim();

        return trimmed.Length <= MaxTargetLength ? trimmed : trimmed[..MaxTargetLength];
    }
}
