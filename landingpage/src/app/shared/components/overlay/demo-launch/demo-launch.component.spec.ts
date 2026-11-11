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

  it('names the demo that is starting and says how long it takes', () => {
    const { fixture } = setup(starting(DemoLaunchPhase.Waking, 1));

    expect(text(fixture, '.demo-launch__heading')).toBe('Getting the Stack86 demo ready');
    expect(text(fixture, '.demo-launch__text')).toContain('The demo needs about a minute to get ready');
  });

  it('ends the message with three dots, hidden from a screen reader, which the styles count up one by one', () => {
    const { fixture } = setup(starting(DemoLaunchPhase.Waking, 1));

    const dots = fixture.nativeElement.querySelector('.demo-launch__text > .demo-launch__dots') as HTMLElement;

    expect(dots.getAttribute('aria-hidden')).toBe('true');
    expect(dots.previousElementSibling?.textContent).toBe('The demo needs about a minute to get ready');
    expect(dots.querySelectorAll('.demo-launch__dot')).toHaveLength(3);
    expect(dots.querySelector('.demo-launch__dot--second')).not.toBeNull();
    expect(dots.querySelector('.demo-launch__dot--third')).not.toBeNull();
  });

  it('changes its wording as the wait gets longer', () => {
    const { fixture, launch } = setup(starting(DemoLaunchPhase.Waking, 1));

    launch.set(starting(DemoLaunchPhase.Slow, 12));
    fixture.detectChanges();
    expect(text(fixture, '.demo-launch__text')).toContain('Almost there.');

    launch.set(starting(DemoLaunchPhase.Stalled, 50));
    fixture.detectChanges();
    expect(text(fixture, '.demo-launch__text')).toContain('This is taking longer than usual.');
  });

  it('shows no count of seconds, whatever the wait', () => {
    const { fixture } = setup(starting(DemoLaunchPhase.Slow, 40));

    expect(text(fixture, '.demo-launch__card')).not.toMatch(/\d+\s*s\b/);
  });

  it('cancels from the Cancel button and from the Escape key', () => {
    const { fixture, cancel } = setup(starting(DemoLaunchPhase.Waking, 1));

    (fixture.nativeElement.querySelector('.button--ghost') as HTMLButtonElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('opens the demo from the Open now button', () => {
    const { fixture, openNow } = setup(starting(DemoLaunchPhase.Stalled, 50));

    const open = fixture.nativeElement.querySelector('.button--primary') as HTMLButtonElement;
    expect(open.textContent?.trim()).toBe('Open now');
    open.click();

    expect(openNow).toHaveBeenCalledTimes(1);
  });
});
