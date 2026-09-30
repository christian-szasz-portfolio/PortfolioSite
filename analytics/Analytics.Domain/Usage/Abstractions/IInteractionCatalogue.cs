namespace Analytics.Domain.Usage.Abstractions;

using Analytics.Domain.Usage.Models;

/// <summary>Which interactions this API counts.</summary>
/// <remarks>The extension point, and the allowlist the endpoint resolves names through.</remarks>
public interface IInteractionCatalogue
{
    /// <summary>Everything counted, in the order the digest should list it.</summary>
    IReadOnlyList<InteractionKind> Kinds { get; }

    /// <summary>The kind with this wire name, or null when it is not one we count.</summary>
    InteractionKind? Resolve(string? name);
}
