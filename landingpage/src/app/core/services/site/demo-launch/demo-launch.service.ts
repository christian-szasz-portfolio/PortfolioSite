import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, PLATFORM_ID, Service, inject, signal } from '@angular/core';
import { Observable, Subscription, defer, from, map, of, retry, switchMap, takeUntil, tap, throwError, timer } from 'rxjs';

import { LocalHostUtils } from '../../../utils/local-host/local-host.utils';
import { DemoLaunch, DemoLaunchPhase } from './demo-launch.types';

/** The liveness path every demo answers, and the one this site may read across origins */
const LIVENESS_PATH = '/health';

/** A start that ends inside this shows nothing, so a warm demo opens with no flicker */
const GRACE_MS = 600;
const TICK_MS = 1000;

/** How long after a failed request the next one is made */
const RETRY_MS = 1500;

/** A cold start measured 47 to 49 seconds, so only well past that is it slow or stalled */
const SLOW_AFTER_SECONDS = 20;
const STALLED_AFTER_SECONDS = 75;

/** Past this the page stops asking, and the visitor can still open the demo by hand */
const GIVE_UP_MS = 300_000;

/** Opens a demo once it answers, and shows the visitor what is going on while it starts */
@Service()
export class DemoLaunchService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly state = signal<DemoLaunch | null>(null);

  private running: Subscription | null = null;

  /** The start in progress once it has outlasted the grace period, otherwise null */
  public readonly launch = this.state.asReadonly();

  /** Opens `url` as soon as its demo answers, which is at once when it is already awake */
  public open(url: string, title: string): void {
    this.cancel();

    if (!this.browser || LocalHostUtils.isLocal(this.document.location?.hostname ?? '') || !URL.canParse(url)) {
      this.go(url);
      return;
    }

    const running = new Subscription();
    this.running = running;

    running.add(
      timer(GRACE_MS, TICK_MS)
        .pipe(
          map((tick) => Math.floor((GRACE_MS + tick * TICK_MS) / 1000)),
          tap((seconds) => this.state.set({ title, url, seconds, phase: DemoLaunchService.phaseAt(seconds) })),
        )
        .subscribe(),
    );

    running.add(
      this.alive(new URL(url).origin)
        .pipe(takeUntil(timer(GIVE_UP_MS)))
        .subscribe(() => this.go(url)),
    );
  }

  /** Opens the demo now, answered or not */
  public openNow(): void {
    const current = this.state();

    if (current !== null) {
      this.go(current.url);
    }
  }

  /** Stops waiting and leaves the visitor where they were */
  public cancel(): void {
    this.running?.unsubscribe();
    this.running = null;
    this.state.set(null);
  }

  /** Cleared first, so going Back to this page never finds a notice for a start that is over */
  private go(url: string): void {
    this.cancel();
    this.document.location.assign(url);
  }

  /**
   * Emits once the demo's liveness path answers 2xx, asking again only after a request fails.
   * Never aborts: a sleeping demo holds the request until it is up, and an abort would throw an
   * AbortError into the page's error handler. Cancelling just stops listening.
   */
  private alive(origin: string): Observable<true> {
    return defer(() => from(fetch(`${origin}${LIVENESS_PATH}`, { credentials: 'omit', cache: 'no-store' }))).pipe(
      switchMap((response) => (response.ok ? of(true as const) : throwError(() => new Error(`The demo answered ${response.status}`)))),
      retry({ delay: RETRY_MS }),
    );
  }

  private static phaseAt(seconds: number): DemoLaunchPhase {
    if (seconds >= STALLED_AFTER_SECONDS) {
      return DemoLaunchPhase.Stalled;
    }

    return seconds >= SLOW_AFTER_SECONDS ? DemoLaunchPhase.Slow : DemoLaunchPhase.Waking;
  }
}
