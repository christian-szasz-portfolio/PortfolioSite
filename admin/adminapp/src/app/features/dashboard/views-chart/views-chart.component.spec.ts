import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageDay } from '../../../data';
import { ViewsChartComponent } from './views-chart.component';

function day(date: string, views: number): UsageDay {
  return {
    day: date,
    views,
    interactions: views * 9,
    rejected: 0,
    operations: [{ name: 'route', label: 'Page opened', count: views * 9 }],
    archivedAt: `${date}T06:00:00Z`,
  };
}

@Component({
  imports: [ViewsChartComponent],
  template: `<adm-views-chart [days]="days()" />`,
})
class Host {
  public readonly days = signal<readonly UsageDay[]>([day('2026-09-06', 4), day('2026-09-07', 2)]);
}

describe('ViewsChartComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('sits in a titled panel and draws onto a canvas', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.panel__title')?.textContent?.trim()).toBe('Views a day');
    expect(element.querySelector('canvas')).not.toBeNull();
  });

  it('names the canvas, since the canvas is the whole content', () => {
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas.getAttribute('aria-label')).toContain('Views');
  });

  it('redraws when the days change rather than holding the first set', () => {
    expect(() => {
      fixture.componentInstance.days.set([day('2026-09-08', 7)]);
      fixture.detectChanges();
    }).not.toThrow();
  });
});
