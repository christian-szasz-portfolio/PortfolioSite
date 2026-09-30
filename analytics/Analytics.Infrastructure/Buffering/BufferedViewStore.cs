namespace Analytics.Infrastructure.Buffering;

using Analytics.Domain.Abstractions.Views;
using Analytics.Domain.Models;

/// <summary>Counts views in memory and adds what is buffered to reads, so a request never waits on storage.</summary>
/// <remarks>The trade is durability: what is buffered is lost if the host dies ungracefully.</remarks>
public sealed class BufferedViewStore(IViewAccumulator durable, IViewBuffer buffer) : IViewStore
{
    public async Task<ViewStats> RecordAsync(string country, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        buffer.Add(CountryCode.Normalise(country));

        return await this.ReadAsync(cancellationToken);
    }

    public async Task<ViewStats> ReadAsync(CancellationToken cancellationToken)
    {
        // Both halves under one hold. Read them separately and a flush lands between: it takes
        // the view out of the buffer while this is still waiting on storage, and the answer is
        // short by the view the caller just recorded. See <see cref="ViewFlushGate"/>.
        using IDisposable hold = await buffer.HoldAsync(cancellationToken);

        ViewStats stored = await durable.ReadAsync(cancellationToken);

        return stored.CombinedWith(buffer.Snapshot());
    }
}
