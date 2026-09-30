import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '@christian-szasz-portfolio/common-web';

import { cv } from '../../data';
import { CvDocumentComponent } from '../../shared/components/cv/cv-document/cv-document.component';

/** The CV on its own page, so it has an address worth putting in an application */
@Component({
  selector: 'lpg-cv-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CvDocumentComponent],
  templateUrl: './cv-page.component.html',
  styleUrl: './cv-page.component.scss',
})
export class CvPageComponent {
  protected readonly cv = cv;

  public constructor() {
    inject(SeoService).apply({
      title: cv.documentTitle,
      description: cv.description,
      path: '/cv',
    });
  }
}
