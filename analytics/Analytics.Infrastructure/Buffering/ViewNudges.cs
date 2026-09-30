namespace Analytics.Infrastructure.Buffering;

using System.Threading.Channels;

/// <summary>Tells the flusher that views are waiting, carrying nudges rather than counts.</summary>
public sealed class ViewNudges
{
    private readonly Channel<byte> channel;

    public ViewNudges(int queueLength)
    {
        this.channel = Channel.CreateBounded<byte>(new BoundedChannelOptions(queueLength)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false,
        });
    }

    /// <summary>Says a view has been counted. Never blocks, and never fails when full.</summary>
    public void Notify()
    {
        this.channel.Writer.TryWrite(0);
    }

    /// <summary>Waits for a nudge and clears any that queued behind it.</summary>
    public async Task WaitAsync(CancellationToken cancellationToken)
    {
        await this.channel.Reader.WaitToReadAsync(cancellationToken);

        while (this.channel.Reader.TryRead(out _))
        {
        }
    }
}
