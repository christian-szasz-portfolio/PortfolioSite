import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormulaFieldComponent, HobbyGlyphs } from '@christian-szasz-portfolio/common-web';

import { RevealDirective } from '../../../shared/directives/reveal/reveal.directive';

/** The opening band: a portrait with an animated ring, and a short technical + off-the-clock introduction. */
@Component({
  selector: 'lpg-profile-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormulaFieldComponent, RevealDirective],
  templateUrl: './profile-section.component.html',
  styleUrl: './profile-section.component.scss',
})
export class ProfileSectionComponent {
  protected readonly glyphs = HobbyGlyphs;

  /** A lumpy "thought cloud" outline (a scalloped ellipse) used as the quote bubble's border. */
  protected readonly cloudPath = ProfileSectionComponent.buildCloud();

  private static buildCloud(): string {
    // Centred in the 240x150 viewBox with an even bump count, so the outline is symmetric
    const cx = 120;
    const cy = 75;
    const rx = 92;
    const ry = 52;
    const bumps = 14;

    const points: readonly { readonly x: number; readonly y: number }[] = Array.from(
      { length: bumps },
      (_unused, index) => {
        const angle = (index / bumps) * Math.PI * 2 - Math.PI / 2;
        return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
      },
    );

    const start = points[0] ?? { x: cx, y: cy - ry };
    let path = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
    for (let index = 0; index < bumps; index += 1) {
      const from = points[index] ?? start;
      const to = points[(index + 1) % bumps] ?? start;
      const chord = Math.hypot(to.x - from.x, to.y - from.y);
      const radius = (chord * 0.62).toFixed(1);
      // A convex arc per segment gives each lobe of the cloud.
      path += ` A ${radius} ${radius} 0 0 1 ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
    }

    return `${path} Z`;
  }
}
