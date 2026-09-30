namespace Analytics.Api.Health;

/// <summary>One worker's last sign of life, as the readiness payload carries it.</summary>
/// <param name="AgeSeconds">How long ago it last completed a cycle.</param>
/// <param name="PeriodSeconds">How often it expects to complete one.</param>
/// <param name="Overdue">Whether it has missed its window by enough to say so.</param>
public sealed record WorkerBeat(long AgeSeconds, long PeriodSeconds, bool Overdue);
