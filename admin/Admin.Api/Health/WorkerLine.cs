namespace Admin.Api.Health;

/// <summary>One background worker's last sign of life.</summary>
/// <param name="Name">The worker's name, such as views-flush.</param>
/// <param name="AgeSeconds">How long ago it last completed a cycle.</param>
/// <param name="PeriodSeconds">How often it expects to complete one.</param>
/// <param name="Overdue">Whether it has missed its window by enough to say so.</param>
public sealed record WorkerLine(string Name, long AgeSeconds, long PeriodSeconds, bool Overdue);
