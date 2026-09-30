import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSnapshot } from '../../../data';
import { CountriesChartComponent } from './countries-chart.component';

const SNAPSHOT: ViewSnapshot = {
  day: '2026-09-07',
  takenAt: '2026-09-07T06:00:00Z',
  total: 46,
  countries: [{ code: 'RO', count: 46 }],
};

@Component({
  imports: [CountriesChartComponent],
  template: `<adm-countries-chart [snapshot]="snapshot()" />`,
})
class Host {
  public readonly snapshot = signal(SNAPSHOT);
}

describe('CountriesChartComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('sits in a titled panel and draws onto a canvas', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.panel__title')?.textContent?.trim()).toBe('Where they were');
    expect(element.querySelector('canvas')).not.toBeNull();
  });

  // This total is not tied to the days beside it, so the panel has to say when it was taken or a
  // reader will read it as today's figure.
  it('says which day the counter was read on', () => {
    expect(fixture.nativeElement.querySelector('.panel__note')?.textContent).toContain(
      '2026-09-07',
    );
  });
});
