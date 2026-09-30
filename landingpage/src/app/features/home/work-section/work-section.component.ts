import { ChangeDetectionStrategy, Component } from '@angular/core';

import { projects } from '../../../data';
import { CarouselComponent } from '../../../shared/components/media/carousel/carousel.component';
import { SectionHeaderComponent } from '../../../shared/components/headings/section-header/section-header.component';
import { SectionSpyDirective } from '../../../shared/directives/section-spy/section-spy.directive';
import { ProjectCardComponent, ProjectCardVariant } from '../project-card/project-card.component';

@Component({
  selector: 'lpg-work-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CarouselComponent, SectionHeaderComponent, SectionSpyDirective, ProjectCardComponent],
  templateUrl: './work-section.component.html',
  styleUrl: './work-section.component.scss',
})
export class WorkSectionComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly variants = ProjectCardVariant;

  protected readonly projects = projects;
}
