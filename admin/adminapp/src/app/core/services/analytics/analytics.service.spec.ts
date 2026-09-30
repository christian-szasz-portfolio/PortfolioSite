import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Health, Overview, SyncReport } from '../../../data';
import { AnalyticsService } from './analytics.service';

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
  reachable: true,
  problem: null,
  status: 'Healthy',
  checks: [{ name: 'storage', status: 'Healthy', note: 'Reachable.', ms: 4 }],
  workers: [{ name: 'views-flush', ageSeconds: 2, periodSeconds: 5, overdue: false }],
};

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
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

  it('keeps what the API said about itself', () => {
    service.checkHealth();

    http.expectOne('/api/admin/health').flush(HEALTH);

    expect(service.health()?.status).toBe('Healthy');
    expect(service.checking()).toBe(false);
  });

  // The archive draws off local disk and this call leaves the machine, so a failure here belongs
  // in the panel that asked rather than across the whole page.
  it('answers an unreachable API in the panel rather than as a page error', () => {
    service.checkHealth();

    http.expectOne('/api/admin/health').error(new ProgressEvent('failed'));

    expect(service.health()?.reachable).toBe(false);
    expect(service.health()?.problem).not.toBeNull();
    expect(service.error()).toBeNull();
    expect(service.checking()).toBe(false);
  });

  // Asking the API is not what the sync button does, and a slow one must not look like a slow page.
  it('keeps its own busy flag, apart from the one the archive uses', () => {
    service.checkHealth();

    expect(service.checking()).toBe(true);
    expect(service.busy()).toBe(false);

    http.expectOne('/api/admin/health').flush(HEALTH);
  });
});
