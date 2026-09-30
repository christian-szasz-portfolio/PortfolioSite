import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewCounterService, ViewStats } from '@christian-szasz-portfolio/common-web';

import { ViewBreakdownComponent } from './view-breakdown.component';

/** The mounted breakdown and the load it was asked to make */
interface ViewBreakdownHarness {
  readonly fixture: ComponentFixture<ViewBreakdownComponent>;
  readonly ensureLoaded: ReturnType<typeof vi.fn>;
}

function mount(initial: ViewStats | null): ViewBreakdownHarness {
  const stats = signal<ViewStats | null>(initial);
  const ensureLoaded = vi.fn();

  TestBed.configureTestingModule({
    imports: [ViewBreakdownComponent],
    providers: [
      { provide: ViewCounterService, useValue: { stats: stats.asReadonly(), ensureLoaded } },
    ],
  });

  const fixture = TestBed.createComponent(ViewBreakdownComponent);
  fixture.detectChanges();
  return { fixture, ensureLoaded };
}

function textsOf(fixture: ComponentFixture<ViewBreakdownComponent>, selector: string): string[] {
  return [...fixture.nativeElement.querySelectorAll(selector)].map((element) =>
    ((element as HTMLElement).textContent ?? '').trim(),
  );
}

describe('ViewBreakdownComponent', () => {
  it('asks the service to load on creation', () => {
    const { ensureLoaded } = mount(null);

    expect(ensureLoaded).toHaveBeenCalledTimes(1);
  });

  it('shows nothing before the counts load', () => {
    const { fixture } = mount(null);

    expect(fixture.nativeElement.querySelector('.view-breakdown')).toBeNull();
  });

  it('shows nothing when there are no views yet', () => {
    const { fixture } = mount({ total: 0, countries: [] });

    expect(fixture.nativeElement.querySelector('.view-breakdown')).toBeNull();
  });

  it('names countries, keeps order, and labels the unknown one', () => {
    const { fixture } = mount({
      total: 6,
      countries: [
        { code: 'RO', count: 3 },
        { code: 'US', count: 2 },
        { code: 'ZZ', count: 1 },
      ],
    });

    expect(textsOf(fixture, '.view-breakdown__name')).toEqual([
      'Romania',
      'United States',
      'Unknown',
    ]);
    expect(textsOf(fixture, '.view-breakdown__count')).toEqual(['3', '2', '1']);
  });

  it('sizes each bar against the busiest country', () => {
    const { fixture } = mount({
      total: 6,
      countries: [
        { code: 'RO', count: 4 },
        { code: 'US', count: 2 },
      ],
    });

    const bars = [
      ...fixture.nativeElement.querySelectorAll('.view-breakdown__bar'),
    ] as HTMLElement[];
    expect(bars.length).toBe(2);
    expect(bars[0]?.style.getPropertyValue('--share')).toBe('100%');
    expect(bars[1]?.style.getPropertyValue('--share')).toBe('50%');
  });
});
