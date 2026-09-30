import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GithubIconComponent } from '@christian-szasz-portfolio/common-web';

import { Project } from '../../../data';
import { BreadcrumbsComponent, Crumb } from '../../../shared/components/headings/breadcrumbs/breadcrumbs.component';
import { ChipListComponent } from '../../../shared/components/lists/chip-list/chip-list.component';
import { IconComponent } from '../../../shared/components/marks/icon/icon.component';
import { MediaFrameComponent } from '../../../shared/components/media/media-frame/media-frame.component';
import { PageHeaderComponent } from '../../../shared/components/headings/page-header/page-header.component';
import { MagneticDirective } from '../../../shared/directives/magnetic/magnetic.directive';
import { DemoUrlPipe } from '../../../shared/pipes/demo-url/demo-url.pipe';
import { ReadingTimePipe } from '../../../shared/pipes/reading-time/reading-time.pipe';
import { TiltStrength } from '../../../shared/directives/tilt/tilt.directive';

/** The top of a project page: what it is, what it is built from, where it is */
@Component({
  selector: 'lpg-project-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BreadcrumbsComponent,
    ChipListComponent,
    DemoUrlPipe,
    GithubIconComponent,
    IconComponent,
    MagneticDirective,
    MediaFrameComponent,
    PageHeaderComponent,
    ReadingTimePipe,
  ],
  templateUrl: './project-hero.component.html',
  styleUrl: './project-hero.component.scss',
})
export class ProjectHeroComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly tilts = TiltStrength;

  public readonly project = input.required<Project>();
  public readonly trail = input.required<readonly Crumb[]>();
  /** Words in the articles below, which the page counts once */
  public readonly words = input.required<number>();
}
