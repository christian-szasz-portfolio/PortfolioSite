import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import {
  EMPTY,
  MonoTypeOperatorFunction,
  Observable,
  catchError,
  defer,
  finalize,
  map,
  merge,
  of,
  share,
  startWith,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';

import {
  healthTargets,
  Health,
  HealthPhase,
  HealthStatus,
  HealthTarget,
  Overview,
  SyncReport,
  TargetCheck,
} from '../../../data';

/** Where the local service answers. Relative, because it only ever answers on this machine. */
const OVERVIEW = '/api/admin/overview';
const SYNC = '/api/admin/sync';
const HEALTH = '/api/admin/health';

/** How long a target may stay silent before its row says it is waking. */
export const wakingAfterMs = 5_000;

/** The dashboard's data: the archive loads instantly, and only a sync reaches Azure. */
@Service()
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  private readonly overviewSignal = signal<Overview | null>(null);
  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly syncedSignal = signal<SyncReport | null>(null);
  private readonly healthSignal = signal<readonly TargetCheck[]>(
    healthTargets.map((target) => ({ target, phase: HealthPhase.Idle, health: null })),
  );

  /** The archive, or null until the first load. */
  public readonly overview = this.overviewSignal.asReadonly();

  /** True while a load or a sync is in flight, so the page can say so. */
  public readonly busy = this.busySignal.asReadonly();

  /** What went wrong, in words, or null. */
  public readonly error = this.errorSignal.asReadonly();

  /** What the last sync did, or null if none has run this session. */
  public readonly synced = this.syncedSignal.asReadonly();

  /** One row per deployed service: how far asking it has got, and its answer. */
  public readonly health = this.healthSignal.asReadonly();

  /** True while any service is still being asked. */
  public readonly checking = computed(() =>
    this.health().some(
      (check) => check.phase === HealthPhase.Asking || check.phase === HealthPhase.Waking,
    ),
  );

  /** Reads the archive off this machine's disk. */
  public load(): void {
    this.begin();

    this.readArchive().pipe(this.settle()).subscribe();
  }

  /** Fetches from Azure into the archive, then reads it back. */
  public sync(): void {
    this.begin();

    this.http
      .post<SyncReport>(SYNC, {})
      .pipe(
        tap((report) => this.syncedSignal.set(report)),
        // The archive is read back only once the sync has answered, so the two are one stream
        // rather than a promise waiting on a promise.
        switchMap(() => this.readArchive()),
        this.settle(),
      )
      .subscribe();
  }

  /**
   * Asks every deployed service how it is, all at once.
   *
   * One call per service, so a sleeping one does not hold up the rest, and its own busy state:
   * the archive draws instantly off local disk, and these leave the machine. A failure is
   * answered in its row rather than thrown, so an unreachable service is a line in the panel
   * instead of an error across the page.
   */
  public checkHealth(): void {
    merge(...healthTargets.map((target) => this.ask(target))).subscribe((check) =>
      this.healthSignal.update((checks) =>
        checks.map((row) => (row.target === check.target ? check : row)),
      ),
    );
  }

  /** One service's row as it moves from asking, maybe to waking, to its answer. */
  private ask(target: HealthTarget): Observable<TargetCheck> {
    return defer(() => {
      const answer = this.http.get<Health>(`${HEALTH}/${target.toLowerCase()}`).pipe(
        catchError((cause: unknown) => of(AnalyticsService.unreachable(target, cause))),
        map((health) => ({ target, phase: HealthPhase.Answered, health })),
        share(),
      );

      // Still silent after a few seconds means a cold start, which is worth saying.
      const waking = timer(wakingAfterMs).pipe(
        takeUntil(answer),
        map(() => ({ target, phase: HealthPhase.Waking, health: null })),
      );

      return merge(waking, answer).pipe(
        startWith<TargetCheck>({ target, phase: HealthPhase.Asking, health: null }),
      );
    });
  }

  private readArchive(): Observable<Overview> {
    return this.http
      .get<Overview>(OVERVIEW)
      .pipe(tap((overview) => this.overviewSignal.set(overview)));
  }

  private begin(): void {
    this.busySignal.set(true);
    this.errorSignal.set(null);
  }

  /** How every call ends: a failure becomes a sentence, and the page stops being busy. */
  private settle<T>(): MonoTypeOperatorFunction<T> {
    return (source) =>
      source.pipe(
        catchError((cause: unknown) => {
          this.errorSignal.set(AnalyticsService.describe(cause));

          return EMPTY;
        }),
        finalize(() => this.busySignal.set(false)),
      );
  }

  /** What a row shows when the admin service itself could not be asked. */
  private static unreachable(target: HealthTarget, cause: unknown): Health {
    return {
      target,
      reachable: false,
      problem: AnalyticsService.describe(cause),
      status: HealthStatus.Unknown,
      ms: 0,
      checks: [],
      workers: [],
    };
  }

  /** Names the failure, which would otherwise read as [object Object]. */
  private static describe(cause: unknown): string {
    if (cause instanceof HttpErrorResponse) {
      return cause.message;
    }

    return cause instanceof Error ? cause.message : String(cause);
  }
}
