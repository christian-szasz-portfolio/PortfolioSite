namespace Analytics.Api.Endpoints.Diagnostics;

/// <summary>What the wake call did, and which day it was about.</summary>
/// <param name="Outcome">Sent, Empty, AlreadySent, NotConfigured, Undelivered, or NotDue.</param>
/// <param name="Day">The day the digest reports on.</param>
/// <remarks>Answered so a scheduler's own log says what happened without opening a mailbox.</remarks>
public sealed record DigestWake(string Outcome, DateOnly Day);
