import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  Health,
  HealthPhase,
  HealthStatus,
  HealthTarget,
  Overview,
  SyncReport,
  TargetCheck,
} from '../../../data';
import { AnalyticsService, EVENT_SOURCE, HealthStreamEvent } from './analytics.service';

const ARCHIVE: Overview = {
  archiveLocation: 'C:/archive',
  source: 'Azurite emulator',
  isLive: false,
  days: [
    {
      day: '2026-09-06',
      views: 4,
      interactions: 9,
      rejected: 0,
      operations: [{ name: 'route', label: 'Page opened', count: 9 }],
      archivedAt: '2026-09-07T06:00:00Z',
    },
  ],
  operations: [{ name: 'route', label: 'Page opened', count: 9 }],
  archivedViews: 4,
  archivedInteractions: 9,
  views: null,
};

const HEALTH: Health = {
  target: HealthTarget.Api,
  reachable: true,
  problem: null,
  status: HealthStatus.Healthy,
  ms: 310,
  checks: [{ name: 'storage', status: HealthStatus.Healthy, note: 'Reachable.', ms: 4 }],
  workers: [{ name: 'views-flush', ageSeconds: 2, periodSeconds: 5, overdue: false }],
};

/** Stands in for the browser's EventSource, and lets a test push what the service would. */
class FakeEventSource {
  public closed = false;
  private readonly listeners = new Map<string, ((event: Event) => void)[]>();

  public constructor(public readonly url: string) {}

  public addEventListener(name: string, listener: (event: Event) => void): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
  }

  public close(): void {
    this.closed = true;
  }

  public step(check: TargetCheck): void {
    this.fire(HealthStreamEvent.Step, new MessageEvent('message', { data: JSON.stringify(check) }));
  }

  public done(): void {
    this.fire(HealthStreamEvent.Done, new MessageEvent('message', { data: '{}' }));
  }

  public fail(): void {
    this.fire('error', new Event('error'));
  }

  private fire(name: string, event: Event): void {
    for (const listener of this.listeners.get(name) ?? []) {
      listener(event);
    }
  }
}

const REPORT: SyncReport = {
  from: '2026-08-09',
  to: '2026-09-07',
  daysArchived: 2,
  viewsTotal: 46,
  location: 'C:/archive',
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let http: HttpTestingController;
  let stream: FakeEventSource;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: EVENT_SOURCE,
          useValue: (url: string) => {
            stream = new FakeEventSource(url);
            return stream as unknown as EventSource;
          },
        },
      ],
    });

    service = TestBed.inject(AnalyticsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('holds nothing until it is asked to read', () => {
    expect(service.overview()).toBeNull();
    expect(service.busy()).toBe(false);
  });

  it('reads the archive off disk without reaching Azure', () => {
    service.load();

    expect(service.busy()).toBe(true);
    http.expectOne('/api/admin/overview').flush(ARCHIVE);
    http.expectNone('/api/admin/sync');

    expect(service.overview()).toEqual(ARCHIVE);
    expect(service.busy()).toBe(false);
  });

  // One stream, not a promise waiting on a promise: the second call is the first one's
  // continuation, so nothing reads the archive back before the sync has answered.
  it('reads the archive back after a sync, and not before', () => {
    service.sync();

    http.expectNone('/api/admin/overview');
    http.expectOne('/api/admin/sync').flush(REPORT);
    http.expectOne('/api/admin/overview').flush(ARCHIVE);

    expect(service.synced()).toEqual(REPORT);
    expect(service.overview()).toEqual(ARCHIVE);
    expect(service.busy()).toBe(false);
  });

  it('never reads the archive back when the sync itself failed', () => {
    service.sync();

    http.expectOne('/api/admin/sync').error(new ProgressEvent('failed'));
    http.expectNone('/api/admin/overview');

    expect(service.error()).not.toBeNull();
    expect(service.busy()).toBe(false);
  });

  it('says what went wrong and stops being busy, rather than spinning forever', () => {
    service.load();

    http.expectOne('/api/admin/overview').error(new ProgressEvent('failed'));

    expect(service.error()).not.toBeNull();
    expect(service.busy()).toBe(false);
  });

  // A network failure is an HttpErrorResponse, which is not an Error. Without a branch for it the
  // page would show "[object Object]" and tell a reader nothing.
  it('describes a network failure in words', () => {
    service.load();

    http.expectOne('/api/admin/overview').error(new ProgressEvent('failed'), { status: 0 });

    expect(service.error()).toContain('/api/admin/overview');
  });

  it('clears the last failure when the next read succeeds', () => {
    service.load();
    http.expectOne('/api/admin/overview').error(new ProgressEvent('failed'));

    service.load();
    http.expectOne('/api/admin/overview').flush(ARCHIVE);

    expect(service.error()).toBeNull();
  });

  describe('health', () => {
    function row(target: HealthTarget): TargetCheck {
      return service.health().find((check) => check.target === target) as TargetCheck;
    }

    function answered(target: HealthTarget): TargetCheck {
      return { target, phase: HealthPhase.Answered, health: { ...HEALTH, target } };
    }

    it('holds an unasked row for every service', () => {
      expect(service.health().map((check) => check.phase)).toEqual([
        HealthPhase.Idle,
        HealthPhase.Idle,
        HealthPhase.Idle,
      ]);
    });

    // One stream for all three, not a request per service.
    it('opens one stream to the admin service and nothing else', () => {
      service.checkHealth();

      expect(stream.url).toBe('/api/admin/health/stream');
      http.expectNone(() => true);
    });

    // Busy from the press, so the button is disabled before the first step arrives.
    it('marks every row as asking the moment it is pressed', () => {
      service.checkHealth();

      expect(service.health().every((check) => check.phase === HealthPhase.Asking)).toBe(true);
      expect(service.checking()).toBe(true);
    });

    it('fills each row with the step the stream pushes for it', () => {
      service.checkHealth();

      stream.step({ target: HealthTarget.Api, phase: HealthPhase.Asking, health: null });
      stream.step(answered(HealthTarget.Taskly));
      stream.step({ target: HealthTarget.Stack86, phase: HealthPhase.Waking, health: null });

      expect(row(HealthTarget.Api).phase).toBe(HealthPhase.Asking);
      expect(row(HealthTarget.Taskly).health?.status).toBe(HealthStatus.Healthy);
      expect(row(HealthTarget.Stack86).phase).toBe(HealthPhase.Waking);
      expect(service.checking()).toBe(true);
    });

    // A finished stream the browser still holds would be reopened, and every service asked again.
    it('closes the stream once the service says it is done', () => {
      service.checkHealth();

      for (const target of [HealthTarget.Api, HealthTarget.Taskly, HealthTarget.Stack86]) {
        stream.step(answered(target));
      }
      stream.done();

      expect(stream.closed).toBe(true);
      expect(service.checking()).toBe(false);
    });

    // The archive draws off local disk and this leaves the machine, so a failure belongs in the
    // rows that were still waiting rather than across the whole page.
    it('answers the rows still waiting when the stream fails, and keeps the rest', () => {
      service.checkHealth();

      stream.step(answered(HealthTarget.Taskly));
      stream.step({ target: HealthTarget.Api, phase: HealthPhase.Waking, health: null });
      stream.fail();

      expect(row(HealthTarget.Taskly).health?.reachable).toBe(true);
      expect(row(HealthTarget.Api).health?.reachable).toBe(false);
      expect(row(HealthTarget.Api).health?.problem).toContain('closed the health stream');
      expect(service.error()).toBeNull();
      expect(service.checking()).toBe(false);
      expect(stream.closed).toBe(true);
    });

    // Asking is not what the sync button does, and a slow service must not look like a slow page.
    it('keeps its own busy flag, apart from the one the archive uses', () => {
      service.checkHealth();
      stream.step({ target: HealthTarget.Api, phase: HealthPhase.Asking, health: null });

      expect(service.checking()).toBe(true);
      expect(service.busy()).toBe(false);
    });
  });
});
