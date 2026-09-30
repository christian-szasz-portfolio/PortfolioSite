import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project } from '../../../data';

/** What to read next, at the foot of a project page */
@Component({
  selector: 'lpg-project-pager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './project-pager.component.html',
  styleUrl: './project-pager.component.scss',
})
export class ProjectPagerComponent {
  public readonly previous = input<Project | null>(null);
  public readonly next = input<Project | null>(null);
}
