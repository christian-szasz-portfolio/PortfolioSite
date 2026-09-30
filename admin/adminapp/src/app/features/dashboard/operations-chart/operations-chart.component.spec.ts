import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageDay, UsageOperation } from '../../../data';
import { OperationsChartComponent } from './operations-chart.component';

const DAYS: readonly UsageDay[] = [
  {
    day: '2026-09-06',
    views: 4,
    interactions: 9,
    rejected: 0,
    operations: [{ name: 'route', label: 'Page opened', count: 9 }],
    archivedAt: '2026-09-07T06:00:00Z',
  },
];

@Component({
  imports: [OperationsChartComponent],
  template: `<adm-operations-chart [days]="days()" [operations]="operations()" />`,
})
class Host {
  public readonly days = signal(DAYS);
  public readonly operations = signal<readonly UsageOperation[]>([
    { name: 'route', label: 'Page opened', count: 9 },
  ]);
}

describe('OperationsChartComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('sits in a titled panel and draws onto a canvas', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.panel__title')?.textContent?.trim()).toBe('What people did');
    expect(element.querySelector('canvas')).not.toBeNull();
  });

  it('says what the canvas holds, stacking included', () => {
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas.getAttribute('aria-label')).toContain('stacked');
  });

  // The note has to follow the shape: on one day the chart is a pie, and promising a reader a
  // day-by-day cut of something drawn as one circle is a note that lies.
  it('says it is showing one day while that is all there is', () => {
    expect(fixture.nativeElement.querySelector('.panel__note')?.textContent).toContain(
      'The one day held',
    );
  });

  it('says it is showing each day once there is more than one', () => {
    fixture.componentInstance.days.set([
      ...DAYS,
      {
        day: '2026-09-07',
        views: 2,
        interactions: 3,
        rejected: 0,
        operations: [{ name: 'route', label: 'Page opened', count: 3 }],
        archivedAt: '2026-09-08T06:00:00Z',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.panel__note')?.textContent).toContain('Each day');
  });

  it('redraws when a sync brings new operations', () => {
    expect(() => {
      fixture.componentInstance.operations.set([
        { name: 'route', label: 'Page opened', count: 9 },
        { name: 'cv.open', label: 'CV opened', count: 2 },
      ]);
      fixture.detectChanges();
    }).not.toThrow();
  });
});
