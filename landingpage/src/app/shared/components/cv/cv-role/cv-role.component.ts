import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CvRole } from '../../../../data/cv.types';

/** One entry in the work history */
@Component({
  selector: 'lpg-cv-role',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cv-role.component.html',
  styleUrl: './cv-role.component.scss',
})
export class CvRoleComponent {
  public readonly role = input.required<CvRole>();
}
