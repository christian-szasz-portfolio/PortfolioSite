namespace Admin.Api.Health;

using System.Runtime.CompilerServices;
using System.Threading.Channels;

/// <summary>Asks every target at once and yields each step as it happens.</summary>
public sealed class HealthStream(IHealthProbe probe, TimeProvider clock)
{
    /// <summary>How long a target may stay silent before it is reported as waking.</summary>
    public static readonly TimeSpan WakingAfter = TimeSpan.FromSeconds(5);

    /// <summary>Asking, maybe waking, then answered, for every target, in the order they happen.</summary>
    public async IAsyncEnumerable<HealthEvent> ReadAllAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        Channel<HealthEvent> events = Channel.CreateUnbounded<HealthEvent>();

        Task[] asks = [.. Enum.GetValues<HealthTarget>().Select(target => this.AskAsync(target, events.Writer, cancellationToken))];

        _ = CompleteAsync(asks, events.Writer);

        await foreach (HealthEvent step in events.Reader.ReadAllAsync(cancellationToken))
        {
            yield return step;
        }
    }

    private static async Task CompleteAsync(Task[] asks, ChannelWriter<HealthEvent> writer)
    {
        try
        {
            await Task.WhenAll(asks);
        }
        catch (OperationCanceledException)
        {
            // The caller left; nobody is reading.
        }
        finally
        {
            writer.TryComplete();
        }
    }

    private async Task AskAsync(HealthTarget target, ChannelWriter<HealthEvent> writer, CancellationToken cancellationToken)
    {
        await writer.WriteAsync(new HealthEvent(target, HealthPhase.Asking, null), cancellationToken);

        Task<TargetHealth> answer = probe.ReadAsync(target, cancellationToken);
        Task silence = Task.Delay(WakingAfter, clock, cancellationToken);

        if (await Task.WhenAny(answer, silence) == silence && !answer.IsCompleted)
        {
            await writer.WriteAsync(new HealthEvent(target, HealthPhase.Waking, null), cancellationToken);
        }

        await writer.WriteAsync(new HealthEvent(target, HealthPhase.Answered, await answer), cancellationToken);
    }
}
