namespace Analytics.Domain.Usage.Models;

/// <summary>One thing worth counting, named once for the wire, the tally and the digest.</summary>
/// <remarks>Only the catalogue builds one, and the wire name is narrow because it reaches an email.</remarks>
public sealed class InteractionKind : IEquatable<InteractionKind>
{
    /// <summary>Long enough for a readable dotted name, short enough to bound a request.</summary>
    public const int MaxNameLength = 40;

    private InteractionKind(string name, string label, int order)
    {
        this.Name = name;
        this.Label = label;
        this.Order = order;
    }

    /// <summary>What the page sends, e.g. <c>cv.download.pdf</c>.</summary>
    public string Name { get; }

    /// <summary>What the digest calls it, e.g. <c>CV downloaded as PDF</c>.</summary>
    public string Label { get; }

    /// <summary>Where it sits in the list of operations. Lower comes first.</summary>
    public int Order { get; }

    /// <summary>A kind the API counts, named in lowercase letters, digits, dots and dashes.</summary>
    public static InteractionKind Named(string name, string label, int order)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(label);

        if (name.Length > MaxNameLength || !name.All(IsNameCharacter))
        {
            throw new ArgumentException(
                "An interaction kind is lowercase letters, digits, dots and dashes, at most "
                + $"{MaxNameLength} characters. Got: {name}",
                nameof(name));
        }

        return new InteractionKind(name, label, order);
    }

    public bool Equals(InteractionKind? other)
    {
        return other is not null && string.Equals(this.Name, other.Name, StringComparison.Ordinal);
    }

    public override bool Equals(object? obj)
    {
        return this.Equals(obj as InteractionKind);
    }

    public override int GetHashCode()
    {
        return StringComparer.Ordinal.GetHashCode(this.Name);
    }

    public override string ToString()
    {
        return this.Name;
    }

    private static bool IsNameCharacter(char character)
    {
        return character is (>= 'a' and <= 'z') or (>= '0' and <= '9') or '.' or '-';
    }
}
