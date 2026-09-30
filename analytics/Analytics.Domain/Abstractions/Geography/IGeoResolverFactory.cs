namespace Analytics.Domain.Abstractions.Geography;

/// <summary>Builds the geo resolver this deployment should use.</summary>
public interface IGeoResolverFactory
{
    /// <summary>The resolver to use for this run.</summary>
    IGeoResolver Create();
}
