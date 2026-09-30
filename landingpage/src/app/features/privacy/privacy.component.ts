import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '@christian-szasz-portfolio/common-web';

import { PageHeaderComponent } from '../../shared/components/headings/page-header/page-header.component';
import { PrivacyPolicyContentComponent } from '../../shared/components/legal/privacy-policy-content/privacy-policy-content.component';

/** The privacy policy on its own route: the SEO and no-JS fallback for the privacy modal. */
@Component({
  selector: 'lpg-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, PrivacyPolicyContentComponent],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent {
  public constructor() {
    inject(SeoService).apply({
      title: $localize`:@@privacy.page.title:Privacy policy - Christian-Ioan Szasz`,
      description: $localize`:@@privacy.page.description:How this website handles data: no accounts, no analytics and no third-party trackers, with a consent-based visit count that derives an approximate country from a network address it never stores.`,
      path: '/privacy',
      type: 'article',
    });
  }
}
