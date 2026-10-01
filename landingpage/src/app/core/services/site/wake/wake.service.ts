import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, PLATFORM_ID, Service, inject } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { apiUrl, demoUrls } from '../../../../data/site.data';
import { LocalHostUtils } from '../../../utils/local-host/local-host.utils';

/** The liveness path every backend answers, and the one this site may read across origins */
const LIVENESS_PATH = '/health';

/**
 * Wakes the API and both demos the moment a visitor lands, all at once. Each scales to zero and
 * takes most of a minute to start, about as long as a reader spends before clicking through.
 */
@Service()
export class WakeService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly hostname = inject(DOCUMENT).location?.hostname ?? '';

  public wakeAll(targets: readonly string[] = [apiUrl, ...demoUrls]): void {
    // Local backends never sleep, and a local run must not reach production
    if (!this.browser || LocalHostUtils.isLocal(this.hostname)) {
      return;
    }

    const origins = new Set(targets.filter((target) => URL.canParse(target)).map((target) => new URL(target).origin));

    // Only the request matters, not the answer; a backend that is down fails where it is used
    for (const origin of origins) {
      fromFetch(`${origin}${LIVENESS_PATH}`, { credentials: 'omit', cache: 'no-store' })
        .pipe(catchError(() => EMPTY))
        .subscribe();
    }
  }
}
