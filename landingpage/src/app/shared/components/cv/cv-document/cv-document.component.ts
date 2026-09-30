import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { cv } from '../../../../data/cv.data';
import { Cv } from '../../../../data/cv.types';
import { CvMainComponent } from '../cv-main/cv-main.component';
import { CvSidebarComponent } from '../cv-sidebar/cv-sidebar.component';

/** The A4 sheet, owning the tokens both columns spend, since custom properties inherit */
@Component({
  selector: 'lpg-cv-document',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CvMainComponent, CvSidebarComponent],
  templateUrl: './cv-document.component.html',
  styleUrl: './cv-document.component.scss',
})
export class CvDocumentComponent {
  public readonly cv = input<Cv>(cv);
}
