import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Pillar } from '../../../data';
import { RevealDirective, RevealVariant } from '../../../shared/directives/reveal/reveal.directive';
import { TiltDirective, TiltStrength } from '../../../shared/directives/tilt/tilt.directive';

/** One of the opinions, as a card */
@Component({
  selector: 'lpg-pillar-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, TiltDirective],
  templateUrl: './pillar-card.component.html',
  styleUrl: './pillar-card.component.scss',
})
export class PillarCardComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly tilts = TiltStrength;

  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly reveals = RevealVariant;

  public readonly pillar = input.required<Pillar>();
}
