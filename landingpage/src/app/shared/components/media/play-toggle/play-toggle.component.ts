import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Where the toggle sits: a frame's window chrome, or a pop-up's toolbar beside Fit and Download */
export enum PlayToggleVariant {
  Chrome = 'chrome',
  Tool = 'tool',
}

/** The play and pause control a clip shows, labelled with the action a press will take */
@Component({
  selector: 'lpg-play-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './play-toggle.component.html',
  styleUrl: './play-toggle.component.scss',
})
export class PlayToggleComponent {
  /** The template compares against these, and a template cannot name an enum by itself */
  protected readonly variants = PlayToggleVariant;

  public readonly playing = input.required<boolean>();
  public readonly variant = input<PlayToggleVariant>(PlayToggleVariant.Chrome);

  public readonly toggled = output<void>();

  /** The button carries a word, so it has to be translated like any other */
  protected readonly playLabel = $localize`:@@media.play.cta:Play`;
  protected readonly pauseLabel = $localize`:@@media.pause.cta:Pause`;
}
