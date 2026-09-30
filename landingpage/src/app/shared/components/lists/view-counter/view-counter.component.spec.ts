import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewCounterService, ViewStats } from '@christian-szasz-portfolio/common-web';

import { ViewCounterComponent } from './view-counter.component';

/** The mounted counter, the stats behind it, and the load it was asked to make */
interface ViewCounterHarness {
  readonly fixture: ComponentFixture<ViewCounterComponent>;
  readonly stats: ReturnType<typeof signal<ViewStats | null>>;
  readonly ensureLoaded: ReturnType<typeof vi.fn>;
}

function mount(initial: ViewStats | null): ViewCounterHarness {
  const stats = signal<ViewStats | null>(initial);
  const ensureLoaded = vi.fn();

  TestBed.configureTestingModule({
    imports: [ViewCounterComponent],
    providers: [
      { provide: ViewCounterService, useValue: { stats: stats.asReadonly(), ensureLoaded } },
    ],
  });

  const fixture = TestBed.createComponent(ViewCounterComponent);
  fixture.detectChanges();
  return { fixture, stats, ensureLoaded };
}

describe('ViewCounterComponent', () => {
  it('asks the service to load on creation', () => {
    const { ensureLoaded } = mount(null);

    expect(ensureLoaded).toHaveBeenCalledTimes(1);
  });

  it('shows nothing until the counts have loaded', () => {
    const { fixture } = mount(null);

    expect(fixture.nativeElement.querySelector('.views')).toBeNull();
  });

  it('shows the total beside the eye, and nothing else', () => {
    const { fixture } = mount({
      total: 5,
      countries: [
        { code: 'RO', count: 3 },
        { code: 'US', count: 2 },
      ],
    });

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.views__value')?.textContent?.trim()).toBe('5');
    expect(element.querySelector('.views__eye lpg-icon')).not.toBeNull();
    expect(element.textContent?.replace(/\s+/g, ' ').trim()).toBe('5');
  });

  // The words it used to spell out are the tooltip and the accessible name now, so the figure is
  // still explained to a pointer that hovers and to a reader who cannot see the eye.
  it('says what the number means without printing it beside the number', () => {
    const { fixture } = mount({ total: 5, countries: [{ code: 'RO', count: 5 }] });

    const views = fixture.nativeElement.querySelector('.views') as HTMLElement;

    expect(views.getAttribute('aria-label')).toContain('Total views from everyone');
    expect(views.getAttribute('title')).toBe(views.getAttribute('aria-label'));
    expect(views.getAttribute('data-tip')).toBe(views.getAttribute('aria-label'));
  });

  // Countries moved to the cookies notice, where the per-country breakdown already lives.
  it('no longer carries the country count', () => {
    const { fixture } = mount({
      total: 5,
      countries: [
        { code: 'RO', count: 3 },
        { code: 'US', count: 2 },
      ],
    });

    expect(fixture.nativeElement.textContent).not.toContain('2');
  });
});
