import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoLaunchService } from '../../../../core/services/site/demo-launch/demo-launch.service';
import { DemoLaunch, DemoLaunchPhase } from '../../../../core/services/site/demo-launch/demo-launch.types';
import { DemoLaunchComponent } from './demo-launch.component';

interface DemoLaunchHarness {
  readonly fixture: ComponentFixture<DemoLaunchComponent>;
  readonly launch: ReturnType<typeof signal<DemoLaunch | null>>;
  readonly cancel: ReturnType<typeof vi.fn>;
  readonly openNow: ReturnType<typeof vi.fn>;
}

const starting = (phase: DemoLaunchPhase, seconds: number): DemoLaunch => ({
  title: 'Stack86',
  url: 'https://demo.example/',
  phase,
  seconds,
});

function setup(initial: DemoLaunch | null): DemoLaunchHarness {
  const launch = signal<DemoLaunch | null>(initial);
  const cancel = vi.fn();
  const openNow = vi.fn();

  TestBed.configureTestingModule({
    imports: [DemoLaunchComponent],
    providers: [{ provide: DemoLaunchService, useValue: { launch: launch.asReadonly(), cancel, openNow } }],
  });

  const fixture = TestBed.createComponent(DemoLaunchComponent);
  fixture.detectChanges();

  return { fixture, launch, cancel, openNow };
}

const text = (fixture: ComponentFixture<DemoLaunchComponent>, selector: string): string | undefined =>
  (fixture.nativeElement.querySelector(selector) as HTMLElement | null)?.textContent?.replace(/\s+/g, ' ').trim();

describe('DemoLaunchComponent', () => {
  it('keeps its live region in the page but shows nothing while no demo is starting', () => {
    const { fixture } = setup(null);

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.demo-launch__card')).toBeNull();
  });

  it('names the demo that is starting and says why it takes a moment', () => {
    const { fixture } = setup(starting(DemoLaunchPhase.Waking, 1));

    expect(text(fixture, '.demo-launch__heading')).toBe('Starting the Stack86 demo');
    expect(text(fixture, '.demo-launch__text')).toBe('The demo sleeps when nobody is using it. It opens as soon as it is ready, usually within a minute.');
  });

  it('changes its wording as the wait gets longer', () => {
    const { fixture, launch } = setup(starting(DemoLaunchPhase.Waking, 1));

    launch.set(starting(DemoLaunchPhase.Slow, 12));
    fixture.detectChanges();
    expect(text(fixture, '.demo-launch__text')).toContain('Still starting.');

    launch.set(starting(DemoLaunchPhase.Stalled, 50));
    fixture.detectChanges();
    expect(text(fixture, '.demo-launch__text')).toContain('The demo has not answered yet.');
  });

  it('counts the seconds only once the wait is noticeable, and hides the count from a screen reader', () => {
    const { fixture, launch } = setup(starting(DemoLaunchPhase.Waking, 2));
    expect(fixture.nativeElement.querySelector('.demo-launch__seconds')).toBeNull();

    launch.set(starting(DemoLaunchPhase.Waking, 7));
    fixture.detectChanges();

    const seconds = fixture.nativeElement.querySelector('.demo-launch__seconds') as HTMLElement;
    expect(seconds.textContent?.trim()).toBe('7 s');
    expect(seconds.getAttribute('aria-hidden')).toBe('true');
  });

  it('cancels from the Cancel button and from the Escape key', () => {
    const { fixture, cancel } = setup(starting(DemoLaunchPhase.Waking, 1));

    (fixture.nativeElement.querySelector('.button--ghost') as HTMLButtonElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('opens the demo from the Open anyway button', () => {
    const { fixture, openNow } = setup(starting(DemoLaunchPhase.Stalled, 50));

    const open = fixture.nativeElement.querySelector('.button--primary') as HTMLButtonElement;
    expect(open.textContent?.trim()).toBe('Open anyway');
    open.click();

    expect(openNow).toHaveBeenCalledTimes(1);
  });
});
