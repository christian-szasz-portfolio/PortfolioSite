import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import {
  EMPTY,
  MonoTypeOperatorFunction,
  Observable,
  catchError,
  finalize,
  switchMap,
  tap,
} from 'rxjs';

import { Health, Overview, SyncReport } from '../../../data';

/** Where the local service answers. Relative, because it only ever answers on this machine. */
const OVERVIEW = '/api/admin/overview';
const SYNC = '/api/admin/sync';
const HEALTH = '/api/admin/health';

/** The dashboard's data: the archive loads instantly, and only a sync reaches Azure. */
@Service()
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  private readonly overviewSignal = signal<Overview | null>(null);
  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly syncedSignal = signal<SyncReport | null>(null);
  private readonly healthSignal = signal<Health | null>(null);
  private readonly checkingSignal = signal(false);

  /** The archive, or null until the first load. */
  public readonly overview = this.overviewSignal.asReadonly();

  /** True while a load or a sync is in flight, so the page can say so. */
  public readonly busy = this.busySignal.asReadonly();

  /** What went wrong, in words, or null. */
  public readonly error = this.errorSignal.asReadonly();

  /** What the last sync did, or null if none has run this session. */
  public readonly synced = this.syncedSignal.asReadonly();

  /** How the analytics API is, or null until it has been asked. */
  public readonly health = this.healthSignal.asReadonly();

  /** True while the API is being asked, which on a sleeping host takes seconds. */
  public readonly checking = this.checkingSignal.asReadonly();

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
   * Asks the analytics API how it is.
   *
   * Its own call, and its own busy flag: the archive draws instantly off local disk, and this one
   * leaves the machine. A failure here is answered rather than thrown, so an unreachable API is a
   * line in one panel instead of an error across the page.
   */
  public checkHealth(): void {
    this.checkingSignal.set(true);

    this.http
      .get<Health>(HEALTH)
      .pipe(
        tap((health) => this.healthSignal.set(health)),
        catchError((cause: unknown) => {
          this.healthSignal.set({
            reachable: false,
            problem: AnalyticsService.describe(cause),
            status: 'Unknown',
            checks: [],
            workers: [],
          });

          return EMPTY;
        }),
        finalize(() => this.checkingSignal.set(false)),
      )
      .subscribe();
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

  /** Names the failure, which would otherwise read as [object Object]. */
  private static describe(cause: unknown): string {
    if (cause instanceof HttpErrorResponse) {
      return cause.message;
    }

    return cause instanceof Error ? cause.message : String(cause);
  }
}
