import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmComponent } from './adm.component';
import { Overview } from './data';

const ARCHIVE: Overview = {
  archiveLocation: 'C:/archive/usage',
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
  views: {
    day: '2026-09-07',
    takenAt: '2026-09-07T06:00:00Z',
    total: 46,
    countries: [{ code: 'RO', count: 40 }],
  },
};

describe('AdmComponent', () => {
  let fixture: ComponentFixture<AdmComponent>;
  let http: HttpTestingController;

  /** Opens the tool and answers the read it makes on the way up. */
  function open(answer: Overview = ARCHIVE): void {
    fixture.detectChanges();
    http.expectOne('/api/admin/overview').flush(answer);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdmComponent);
  });

  afterEach(() => http.verify());

  it('reads the archive as soon as it opens, without reaching Azure', () => {
    open();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Page opened');
    expect(text).toContain('46');
  });

  // Syncing is the one thing that costs money and needs the network, so nothing does it by itself.
  it('only reaches Azure when the button is pressed', () => {
    open();
    http.expectNone('/api/admin/sync');

    const button = fixture.nativeElement.querySelector('.button') as HTMLButtonElement;
    button.click();

    http.expectOne('/api/admin/sync').flush({
      from: '2026-08-09',
      to: '2026-09-07',
      daysArchived: 1,
      viewsTotal: 46,
      location: 'C:/archive/usage',
    });
    http.expectOne('/api/admin/overview').flush(ARCHIVE);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 day archived');
  });

  it('says what went wrong rather than spinning forever', () => {
    fixture.detectChanges();
    http.expectOne('/api/admin/overview').error(new ProgressEvent('failed'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('adm-dashboard')).toBeNull();
  });

  it('shows where on this machine the figures were read from', () => {
    open();

    expect(fixture.nativeElement.querySelector('.bar__where')?.textContent).toContain(
      'C:/archive/usage',
    );
  });

  // The shell holds the service; everything below it is handed what it draws.
  it('hands the archive to the dashboard rather than drawing it itself', () => {
    open();

    expect(fixture.nativeElement.querySelector('adm-dashboard')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('canvas')).toHaveLength(3);
  });
});
