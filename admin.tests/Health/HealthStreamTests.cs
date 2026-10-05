namespace Admin.Tests.Health;

using System.Collections.Concurrent;
using Admin.Api.Health;
using Microsoft.Extensions.Time.Testing;
using Xunit;

/// <summary>The steps the page is pushed while the services answer, in the order they happen.</summary>
public sealed class HealthStreamTests
{
    private readonly FakeTimeProvider clock = new();
    private readonly HeldProbe probe = new();
    private readonly ConcurrentQueue<HealthEvent> seen = new();

    [Fact]
    public async Task SaysEveryTargetIsBeingAskedFirst()
    {
        Task reading = this.Read();

        await this.Until(() => this.seen.Count == 3);

        Assert.All(this.seen, step => Assert.Equal(HealthPhase.Asking, step.Phase));
        Assert.Equal(Enum.GetValues<HealthTarget>(), this.seen.Select(step => step.Target).Order());

        this.probe.AnswerAll();
        await reading;
    }

    /// <summary>One sleeping service must not hold up the others.</summary>
    [Fact]
    public async Task PassesOnEachAnswerAsSoonAsItArrives()
    {
        Task reading = this.Read();
        await this.Until(() => this.seen.Count == 3);

        this.probe.Answer(HealthTarget.Stack86);

        HealthEvent answered = await this.Next(HealthPhase.Answered);
        Assert.Equal(HealthTarget.Stack86, answered.Target);
        Assert.Equal(HealthTarget.Stack86, answered.Health?.Target);

        this.probe.AnswerAll();
        await reading;
    }

    [Fact]
    public async Task SaysATargetThatStaysSilentIsWaking()
    {
        Task reading = this.Read();
        await this.Until(() => this.seen.Count == 3);

        this.probe.Answer(HealthTarget.Stack86);
        await this.Next(HealthPhase.Answered);

        this.clock.Advance(HealthStream.WakingAfter);
        await this.Until(() => this.seen.Count(step => step.Phase == HealthPhase.Waking) == 2);

        HealthTarget[] waking = [.. this.seen.Where(step => step.Phase == HealthPhase.Waking).Select(step => step.Target)];
        Assert.DoesNotContain(HealthTarget.Stack86, waking);

        this.probe.AnswerAll();
        await reading;
    }

    [Fact]
    public async Task EndsOnceEveryTargetHasAnswered()
    {
        Task reading = this.Read();
        await this.Until(() => this.seen.Count == 3);

        this.probe.AnswerAll();
        await reading.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal(3, this.seen.Count(step => step.Phase == HealthPhase.Answered));
    }

    private async Task Read()
    {
        HealthStream stream = new(this.probe, this.clock);

        await foreach (HealthEvent step in stream.ReadAllAsync(CancellationToken.None))
        {
            this.seen.Enqueue(step);
        }
    }

    private async Task<HealthEvent> Next(HealthPhase phase)
    {
        await this.Until(() => this.seen.Any(step => step.Phase == phase));

        return this.seen.First(step => step.Phase == phase);
    }

    private async Task Until(Func<bool> condition)
    {
        for (int attempt = 0; attempt < 200 && !condition(); attempt++)
        {
            await Task.Delay(10);
        }

        Assert.True(condition(), "The stream did not get there in time.");
    }

    /// <summary>Holds every answer until a test releases it.</summary>
    private sealed class HeldProbe : IHealthProbe
    {
        private readonly ConcurrentDictionary<HealthTarget, TaskCompletionSource<TargetHealth>> held = new();

        public Task<TargetHealth> ReadAsync(HealthTarget target, CancellationToken cancellationToken)
        {
            return this.Pending(target).Task;
        }

        public void Answer(HealthTarget target)
        {
            this.Pending(target).TrySetResult(
                new TargetHealth(target, true, null, HealthStatus.Healthy, 1, [], []));
        }

        public void AnswerAll()
        {
            foreach (HealthTarget target in Enum.GetValues<HealthTarget>())
            {
                this.Answer(target);
            }
        }

        private TaskCompletionSource<TargetHealth> Pending(HealthTarget target)
        {
            return this.held.GetOrAdd(
                target,
                _ => new TaskCompletionSource<TargetHealth>(TaskCreationOptions.RunContinuationsAsynchronously));
        }
    }
}
