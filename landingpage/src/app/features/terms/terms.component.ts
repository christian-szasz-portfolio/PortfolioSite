import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '@christian-szasz-portfolio/common-web';

import { PageHeaderComponent } from '../../shared/components/headings/page-header/page-header.component';
import { TermsContentComponent } from '../../shared/components/legal/terms-content/terms-content.component';

/** The terms and conditions on their own route: the SEO and no-JS fallback for the terms modal. */
@Component({
  selector: 'lpg-terms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, TermsContentComponent],
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  public constructor() {
    inject(SeoService).apply({
      title: $localize`:@@terms.page.title:Terms and conditions - Christian-Ioan Szasz`,
      description: $localize`:@@terms.page.description:The terms for using this personal portfolio: intellectual property, no warranty, limitation of liability, external links and governing law.`,
      path: '/terms',
      type: 'article',
    });
  }
}
