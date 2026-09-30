namespace Analytics.Api.Endpoints.Interactions;

using Analytics.Domain.Usage.Models;
using FastEndpoints;
using FluentValidation;

/// <summary>What a batch has to look like before anything reads it.</summary>
/// <remarks>The shape is bounded before the catalogue is asked about the contents.</remarks>
public sealed class InteractionRequestValidator : Validator<InteractionRequest>
{
    /// <summary>Comfortably more than a reader produces between flushes, and still a small read.</summary>
    public const int MaxEvents = 25;

    /// <summary>Longer than a target is kept: an oversized target is cut down rather than refused.</summary>
    public const int MaxTargetLength = 256;

    public InteractionRequestValidator()
    {
        this.RuleFor(request => request.Events)
            .NotEmpty()
            .WithMessage("A batch must report at least one interaction.");

        this.RuleFor(request => request.Events.Count)
            .LessThanOrEqualTo(MaxEvents)
            .WithMessage($"A batch may report at most {MaxEvents} interactions.");

        this.RuleForEach(request => request.Events).ChildRules(report =>
        {
            report.RuleFor(one => one.Kind)
                .NotEmpty()
                .MaximumLength(InteractionKind.MaxNameLength);

            report.RuleFor(one => one.Target)
                .MaximumLength(MaxTargetLength);
        });
    }
}
