namespace Analytics.Domain.Usage.Abstractions;

using Analytics.Domain.Usage.Models;

/// <summary>Counts what happened: the writing half of the window.</summary>
/// <remarks>It sits on the request path, so recording must never fail and never block.</remarks>
public interface IAnalyticsRecorder
{
    /// <summary>Counts one view.</summary>
    void RecordView();

    /// <summary>Counts one interaction.</summary>
    void RecordInteraction(Interaction interaction);

    /// <summary>Counts one interaction the API did not recognise, without keeping what it said.</summary>
    void RecordRejection();
}
