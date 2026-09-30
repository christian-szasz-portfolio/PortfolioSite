import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Pipe, PipeTransform, PLATFORM_ID } from '@angular/core';

import { DemoUrlUtils } from '../../../core/utils/demo-url/demo-url.utils';

/** A demo's address, or its local stand-in when this page is served from this machine */
@Pipe({ name: 'demoUrl' })
export class DemoUrlPipe implements PipeTransform {
  /** Empty while prerendering, so the prerendered page always carries the deployed address */
  private readonly hostname = isPlatformBrowser(inject(PLATFORM_ID)) ? inject(DOCUMENT).location.hostname : '';

  public transform(url: string): string {
    return DemoUrlUtils.forHost(this.hostname, url);
  }
}
