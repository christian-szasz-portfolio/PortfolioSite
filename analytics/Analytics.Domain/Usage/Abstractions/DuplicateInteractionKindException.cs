namespace Analytics.Domain.Usage.Abstractions;

/// <summary>Two interaction kinds were catalogued under one wire name.</summary>
/// <remarks>Named, so a shadowed kind stops the host at startup rather than skewing the digest.</remarks>
public sealed class DuplicateInteractionKindException(string name)
    : InvalidOperationException($"Two interaction kinds share the wire name {name}.")
{
    /// <summary>The name they share.</summary>
    public string Name { get; } = name;
}
