namespace Analytics.Infrastructure.Buffering;

/// <summary>Holds a read and a flush apart, so a flush is never half-visible.</summary>
/// <remarks>The cost is that a read may wait for one flush's write.</remarks>
public sealed class ViewFlushGate : IDisposable
{
    private readonly SemaphoreSlim gate = new(1, 1);

    /// <summary>Waits for the gate and returns the hold; dispose it to let the other side proceed.</summary>
    public async Task<IDisposable> HoldAsync(CancellationToken cancellationToken)
    {
        await this.gate.WaitAsync(cancellationToken);

        return new Hold(this.gate);
    }

    public void Dispose()
    {
        this.gate.Dispose();
    }

    /// <summary>One side's turn, released when it is disposed.</summary>
    private sealed class Hold(SemaphoreSlim gate) : IDisposable
    {
        public void Dispose()
        {
            gate.Release();
        }
    }
}
