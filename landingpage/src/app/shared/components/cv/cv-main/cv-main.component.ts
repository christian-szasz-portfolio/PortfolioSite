import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Cv } from '../../../../data/cv.types';
import { CvRoleComponent } from '../cv-role/cv-role.component';

/** The white column: who he is, then what he has done */
@Component({
  selector: 'lpg-cv-main',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CvRoleComponent],
  templateUrl: './cv-main.component.html',
  styleUrl: './cv-main.component.scss',
})
export class CvMainComponent {
  public readonly cv = input.required<Cv>();
}
