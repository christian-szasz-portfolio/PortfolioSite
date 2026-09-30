import { ChangeDetectionStrategy, Component } from '@angular/core';

import { pillars } from '../../../data';
import { SectionHeaderComponent } from '../../../shared/components/headings/section-header/section-header.component';
import { RevealGroupDirective } from '../../../shared/directives/reveal-group/reveal-group.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy/section-spy.directive';
import { PillarCardComponent } from '../pillar-card/pillar-card.component';

@Component({
  selector: 'lpg-thinking-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PillarCardComponent, RevealGroupDirective, SectionHeaderComponent, SectionSpyDirective],
  templateUrl: './thinking-section.component.html',
  styleUrl: './thinking-section.component.scss',
})
export class ThinkingSectionComponent {
  protected readonly pillars = pillars;
}
