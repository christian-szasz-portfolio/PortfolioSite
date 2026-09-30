import { ChangeDetectionStrategy, Component } from '@angular/core';

import { contact } from '../../../data';
import { ContactListComponent } from '../../../shared/components/lists/contact-list/contact-list.component';
import { CvCardComponent } from '../../../shared/components/lists/cv-card/cv-card.component';
import { DriftDepth, DriftDirective } from '../../../shared/directives/drift/drift.directive';
import { RevealDirective } from '../../../shared/directives/reveal/reveal.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy/section-spy.directive';
import { SplitTextDirective } from '../../../shared/directives/split-text/split-text.directive';

/** Who I am, how to reach me, and the CV */
@Component({
  selector: 'lpg-about-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContactListComponent,
    CvCardComponent,
    DriftDirective,
    RevealDirective,
    SectionSpyDirective,
    SplitTextDirective,
  ],
  templateUrl: './about-section.component.html',
  styleUrl: './about-section.component.scss',
})
export class AboutSectionComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly depths = DriftDepth;

  protected readonly contact = contact;
}
