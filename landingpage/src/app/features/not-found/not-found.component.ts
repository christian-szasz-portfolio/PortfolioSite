import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '@christian-szasz-portfolio/common-web';

import { notFoundSeo, NotFoundContentComponent } from '../../shared/components/messages/not-found-content/not-found-content.component';

/** The 404 on its own route: the metadata, around the shared body */
@Component({
  selector: 'lpg-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotFoundContentComponent],
  template: '<lpg-not-found-content />',
})
export class NotFoundComponent {
  public constructor() {
    inject(SeoService).apply(notFoundSeo);
  }
}
