import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Overview } from '../../data';
import { DashboardComponent } from './dashboard.component';

const EMPTY: Overview = {
  archiveLocation: 'C:/archive',
  source: 'Azurite emulator',
  isLive: false,
  days: [],
  operations: [],
  archivedViews: 0,
  archivedInteractions: 0,
  views: null,
};

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
  views: {
    day: '2026-09-07',
    takenAt: '2026-09-07T06:00:00Z',
    total: 46,
    countries: [{ code: 'RO', count: 46 }],
  },
};

@Component({
  imports: [DashboardComponent],
  template: `<adm-dashboard [overview]="overview()" />`,
})
class Host {
  public readonly overview = signal(ARCHIVE);
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<Host>;

  function element(): HTMLElement {
    return fixture.nativeElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('leads with the four headline numbers as tiles rather than as a chart', () => {
    const cards = element().querySelectorAll('adm-stat-card');

    expect(cards).toHaveLength(4);
    expect(element().querySelector('.cards')?.textContent).toContain('46');
  });

  // Every number in a chart is also in a table, so nothing is only available to a reader who can
  // use a canvas.
  it('draws a chart for each panel and puts the same figures in tables', () => {
    expect(element().querySelectorAll('canvas')).toHaveLength(3);
    expect(element().querySelectorAll('.table')).toHaveLength(2);
  });

  it('leaves the country chart out entirely when no counter has been read', () => {
    fixture.componentInstance.overview.set({ ...ARCHIVE, views: null });
    fixture.detectChanges();

    expect(element().querySelector('adm-countries-chart')).toBeNull();
    expect(element().querySelectorAll('canvas')).toHaveLength(2);
  });

  it('says the archive is empty rather than drawing an empty chart', () => {
    fixture.componentInstance.overview.set(EMPTY);
    fixture.detectChanges();

    expect(element().querySelector('.empty')).not.toBeNull();
    expect(element().querySelector('canvas')).toBeNull();
    expect(element().querySelector('.table')).toBeNull();
  });

  // The tiles stay: zeroes are the answer to "how much is in here", and an empty page is not.
  it('still shows the headline numbers when there is nothing archived', () => {
    fixture.componentInstance.overview.set(EMPTY);
    fixture.detectChanges();

    expect(element().querySelectorAll('adm-stat-card')).toHaveLength(4);
  });
});
