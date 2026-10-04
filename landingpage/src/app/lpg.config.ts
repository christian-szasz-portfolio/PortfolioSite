import { IMAGE_LOADER } from '@angular/common';
import { ApplicationConfig, DOCUMENT, ErrorHandler, inject, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay, withI18nSupport } from '@angular/platform-browser';
import { ANALYTICS_API_BASE, BACKEND_PROBE_URL, VIEW_COUNTER_API_BASE } from '@christian-szasz-portfolio/common-web';
import { ActivatedRouteSnapshot, provideRouter, withInMemoryScrolling, withPreloading, withRouterConfig, withViewTransitions } from '@angular/router';

import { routes } from './lpg.routes';
import { GlobalErrorHandler } from './core/services/platform/error-handler/global-error.handler';
import { ApiBaseUtils } from './core/utils/api-base/api-base.utils';
import { ImageLoader } from './core/utils/image-loader/image-loader.utils';
import { PreloadService } from './core/services/platform/preload/preload.service';
import { provideSeo } from './core/services/site/seo/seo.providers';
import { apiUrl } from './data/site.data';

/** The path a snapshot resolves to, its segments joined, fragment and query dropped. */
function routePath(snapshot: ActivatedRouteSnapshot): string {
  const segments: string[] = [];
  let node: ActivatedRouteSnapshot | null = snapshot;
  while (node !== null) {
    for (const segment of node.url) {
      segments.push(segment.path);
    }
    node = node.firstChild;
  }
  return segments.join('/');
}

/** The API this page may call: the local one on this machine, the deployed one only when deployed. */
function apiBase(): string {
  return ApiBaseUtils.forHost(inject(DOCUMENT).location?.hostname ?? '', apiUrl);
}

/** Where a failed API is asked whether it is back: nowhere on this machine. */
function apiProbe(): string | null {
  return ApiBaseUtils.probeFor(inject(DOCUMENT).location?.hostname ?? '', apiUrl);
}

export const lpgConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Which is what forwards a rejected promise to the handler below.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // NgOptimizedImage builds its srcset from the site's -640/-1280 filenames.
    { provide: IMAGE_LOADER, useValue: ImageLoader.sized },
    provideSeo(),
    { provide: VIEW_COUNTER_API_BASE, useFactory: apiBase },
    { provide: ANALYTICS_API_BASE, useFactory: apiBase },
    { provide: BACKEND_PROBE_URL, useFactory: apiProbe },
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      // Fragment links are how the page navigates, so the router must honour them
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      // A same-page fragment skips the transition, whose snapshot ignores the reserved scrollbar.
      // Skipping logs an `AbortError: Transition was skipped` behind `ngDevMode`: the sound of
      // this working, not failing, and there is no quieter way to decline it.
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          if (routePath(from) === routePath(to)) {
            transition.skipTransition();
          }
        },
      }),
      // Only the routes that marked themselves, never the whole site.
      withPreloading(PreloadService),
    ),
    // Incremental hydration, so a @defer block is still prerendered and only its JavaScript waits.
    // i18n support, or every component with translated text is thrown away and drawn again,
    // which lost a deep link's scroll and shifted the page as it loaded.
    provideClientHydration(withEventReplay(), withI18nSupport()),
  ],
};
