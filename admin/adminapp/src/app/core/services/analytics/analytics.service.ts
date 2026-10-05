import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { InjectionToken, Service, computed, inject, signal } from '@angular/core';
import {
  EMPTY,
  MonoTypeOperatorFunction,
  Observable,
  catchError,
  finalize,
  switchMap,
  tap,
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
const HEALTH_STREAM = '/api/admin/health/stream';

/** The events the health stream sends. */
export enum HealthStreamEvent {
  Step = 'health',
  Done = 'done',
}

/** Opens a server-sent event stream, so a test can hand in its own. */
export const EVENT_SOURCE = new InjectionToken<(url: string) => EventSource>('EVENT_SOURCE', {
  providedIn: 'root',
  factory: () => (url: string) => new EventSource(url),
});

/** The dashboard's data: the archive loads instantly, and only a sync reaches Azure. */
@Service()
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly openEventSource = inject(EVENT_SOURCE);

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
   * Asks every deployed service how it is, all at once, over one event stream.
   *
   * The admin service pushes each step as it happens, so a sleeping service does not hold up
   * the rest and the waking notice needs no timer here. A failure is answered in the rows that
   * were still waiting rather than thrown, so it stays a line in the panel.
   */
  public checkHealth(): void {
    // Busy from the press, not from the first step, so a second press cannot open a second stream
    this.healthSignal.set(
      healthTargets.map((target) => ({ target, phase: HealthPhase.Asking, health: null })),
    );

    this.steps().subscribe({
      next: (step) => this.place(step),
      error: (cause: unknown) =>
        this.healthSignal.update((checks) =>
          checks.map((row) =>
            row.phase === HealthPhase.Answered
              ? row
              : {
                  target: row.target,
                  phase: HealthPhase.Answered,
                  health: AnalyticsService.unreachable(row.target, cause),
                },
          ),
        ),
    });
  }

  /** The stream as an observable that closes it when done, before the browser can reconnect. */
  private steps(): Observable<TargetCheck> {
    return new Observable<TargetCheck>((subscriber) => {
      const source = this.openEventSource(HEALTH_STREAM);

      source.addEventListener(HealthStreamEvent.Step, (message) =>
        subscriber.next(JSON.parse((message as MessageEvent<string>).data) as TargetCheck),
      );
      source.addEventListener(HealthStreamEvent.Done, () => subscriber.complete());
      source.addEventListener('error', () =>
        subscriber.error(new Error('The admin service closed the health stream early.')),
      );

      return () => source.close();
    });
  }

  private place(step: TargetCheck): void {
    this.healthSignal.update((checks) =>
      checks.map((row) => (row.target === step.target ? step : row)),
    );
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
