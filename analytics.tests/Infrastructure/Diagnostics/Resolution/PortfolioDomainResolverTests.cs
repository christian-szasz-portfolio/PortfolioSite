namespace Analytics.Tests.Infrastructure.Diagnostics.Resolution;

using Analytics.Infrastructure.Diagnostics;
using Common.Diagnostics.Models;
using Common.Diagnostics.Resolution;
using Xunit;

/// <summary>One digest covers three apps, so this is what decides where each one appears.</summary>
public sealed class PortfolioDomainResolverTests
{
    private readonly CombinedDomainResolver resolver = PortfolioDomainResolver.Create();

    [Theory]
    [InlineData(PortfolioApps.Analytics, "Analytics.Infrastructure.Buffering.ViewFlushService", "Analytics / Buffering")]
    [InlineData(PortfolioApps.Stack86, "Stack86.Api.Controllers.CompilerController", "Stack86 / Controllers")]
    [InlineData(PortfolioApps.Taskly, "Taskly.Web.Demo.DemoStore", "Taskly / Demo")]
    public void SectionsEachAppUnderItsOwnName(string app, string category, string expected)
    {
        Assert.Equal(expected, this.resolver.Resolve(app, category).Name);
    }

    /// <summary>The site comes first, then the demos, so the sections read in that order.</summary>
    [Fact]
    public void PutsTheSiteAheadOfTheDemos()
    {
        LogDomain analytics = this.resolver.Resolve(PortfolioApps.Analytics, "Microsoft.AspNetCore.Hosting");
        LogDomain stack86 = this.resolver.Resolve(PortfolioApps.Stack86, "Stack86.Api.Middleware.Thing");
        LogDomain taskly = this.resolver.Resolve(PortfolioApps.Taskly, "Taskly.Web.Middleware.Thing");

        Assert.True(analytics.Order < stack86.Order);
        Assert.True(stack86.Order < taskly.Order);
    }

    /// <summary>Why the app is stored: a framework category says nothing about who ran it.</summary>
    [Fact]
    public void KeepsFrameworkNoiseWithTheAppThatProducedIt()
    {
        const string category = "Microsoft.AspNetCore.Server.Kestrel";

        Assert.NotEqual(
            this.resolver.Resolve(PortfolioApps.Stack86, category),
            this.resolver.Resolve(PortfolioApps.Taskly, category));
    }

    /// <summary>The demos have their own folders, and each needs a section it was given a place for.</summary>
    [Theory]
    [InlineData(PortfolioApps.Stack86, "Stack86.Logic.Compilation.Pipeline.CompilationPipeline")]
    [InlineData(PortfolioApps.Taskly, "Taskly.Web.Infrastructure.Security.Csp.NonceWriter")]
    public void OrdersADemoFolderAheadOfItsFrameworkNoise(string app, string category)
    {
        LogDomain folder = this.resolver.Resolve(app, category);
        LogDomain framework = this.resolver.Resolve(app, "Microsoft.AspNetCore.Hosting");

        Assert.True(folder.Order < framework.Order);
    }
}
