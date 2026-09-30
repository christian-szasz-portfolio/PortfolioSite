import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageDay } from '../../../data';
import { DaysTableComponent } from './days-table.component';

function day(date: string, rejected: number): UsageDay {
  return {
    day: date,
    views: 4,
    interactions: 9,
    rejected,
    operations: [{ name: 'route', label: 'Page opened', count: 9 }],
    archivedAt: `${date}T06:00:00Z`,
  };
}

@Component({
  imports: [DaysTableComponent],
  template: `<adm-days-table [days]="days()" />`,
})
class Host {
  public readonly days = signal<readonly UsageDay[]>([day('2026-09-06', 0), day('2026-09-07', 3)]);
}

describe('DaysTableComponent', () => {
  let fixture: ComponentFixture<Host>;

  function column(index: number): string[] {
    return [...fixture.nativeElement.querySelectorAll('tbody tr')].map((row) =>
      ((row as HTMLElement).children[index] as HTMLElement).textContent?.trim(),
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('reads newest first, whatever order the archive holds', () => {
    expect(column(0)).toEqual(['2026-09-07', '2026-09-06']);
  });

  it('shows the four numbers a day is made of', () => {
    expect(column(1)).toEqual(['4', '4']);
    expect(column(2)).toEqual(['9', '9']);
    expect(column(3)).toEqual(['3', '0']);
  });

  // A refusal is the endpoint turning something away, which is worth noticing. Zero is not.
  it('marks a day that had something refused, and leaves a clean day alone', () => {
    const marked = fixture.nativeElement.querySelectorAll('.table__warn');

    expect(marked).toHaveLength(1);
    expect((marked[0] as HTMLElement).textContent?.trim()).toBe('3');
  });
});
