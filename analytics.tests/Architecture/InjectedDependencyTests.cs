namespace Analytics.Tests.Architecture;

using System.Reflection;
using Analytics.Api.Configuration;
using Analytics.Api.Endpoints.Interactions;
using Analytics.Api.Endpoints.Views;
using Analytics.Infrastructure.Buffering;
using Analytics.Infrastructure.Configuration;
using Azure.Data.Tables;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

/// <summary>The rule, enforced rather than written down: injected dependencies are contracts.</summary>
/// <remarks>The exceptions are listed with their reasons, so adding one is a decision.</remarks>
public sealed class InjectedDependencyTests
{
    /// <summary>What may be injected without being a contract, and why.</summary>
    private static readonly Dictionary<Type, string> Excused = new()
    {
        [typeof(TimeProvider)] =
            "the abstraction itself: the framework's own seam for the clock",
        [typeof(TableClient)] =
            "the storage SDK's own type, already behind ICounterTable where it matters",
        [typeof(PendingViews)] =
            "state, not behaviour: the tallies themselves, and a substitute would have to "
            + "reimplement their interlocked counting to tell the truth",
        [typeof(ViewNudges)] =
            "state, not behaviour: a bounded channel that carries no information but its own depth",
        [typeof(ViewFlushGate)] =
            "state, not behaviour: one semaphore, whose whole meaning is that there is only one",
    };

    private static readonly HashSet<Assembly> OurAssemblies =
    [
        typeof(GetViewsEndpoint).Assembly,
        typeof(ViewBuffer).Assembly,
        typeof(Analytics.Domain.Views.TableViewStore).Assembly,
    ];

    // Framework-constructed, so these never appear in the service collection: the endpoints,
    // via FastEndpoints. They still take injected dependencies, so the rule tracks what a class
    // is handed, not how. The capturing logger provider left with the security middleware,
    // into Common.Diagnostics, so it is no longer this assembly to police. The security middleware
    // (CORS, rate limiting, headers) moved to Common.Security: its own contracts are its own
    // package's concern now, not this assembly's architecture rule.
    private static readonly Type[] BuiltByTheFramework =
    [
        typeof(GetViewsEndpoint),
        typeof(PostViewsEndpoint),
        typeof(PostInteractionsEndpoint),
    ];

    [Fact]
    public void InjectsNothingThatIsNotAContract()
    {
        List<string> concrete =
        [
            .. from type in Injected()
               from constructor in type.GetConstructors()
               from parameter in constructor.GetParameters()
               where !IsContract(parameter.ParameterType)
               select $"{type.Name}({parameter.ParameterType.Name} {parameter.Name})",
        ];

        Assert.Empty(concrete);
    }

    // A list of exceptions that nobody prunes stops being a list of exceptions and becomes a
    // list of things that used to be true.
    [Fact]
    public void ExcusesNothingThatIsNoLongerInjected()
    {
        HashSet<Type> injected =
        [
            .. from type in Injected()
               from constructor in type.GetConstructors()
               from parameter in constructor.GetParameters()
               select parameter.ParameterType,
        ];

        List<string> stale =
        [
            .. from excused in Excused.Keys
               where !injected.Contains(excused)
               select excused.Name,
        ];

        Assert.Empty(stale);
    }

    /// <summary>Everything the composition root builds by type, plus what the framework builds for it.</summary>
    private static IEnumerable<Type> Injected()
    {
        ServiceCollection services = new();
        services.AddCounter(new ConfigurationBuilder().Build()).AddCounterHttp();

        return services
            .Select(descriptor => descriptor.ImplementationType)
            .OfType<Type>()
            .Concat(BuiltByTheFramework)
            .Where(Ours)
            .Distinct();
    }

    /// <summary>Ours by identity rather than by name, because the host's assembly is called <c>Counter</c>.</summary>
    private static bool Ours(Type type)
    {
        return OurAssemblies.Contains(type.Assembly);
    }

    private static bool IsContract(Type type)
    {
        if (type.IsInterface || type.IsValueType || type == typeof(string))
        {
            return true;
        }

        // A factory delegate over a contract is still a contract: what it hands back is one, and
        // taking it as a delegate is how a transient is asked for more than once.
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Func<>))
        {
            return type.GetGenericArguments()[0].IsInterface;
        }

        return Excused.ContainsKey(type);
    }
}
