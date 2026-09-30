import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { TiltDirective, TiltStrength } from './tilt.directive';

@Component({
  imports: [TiltDirective],
  template: `
    <div class="strong" lpgTilt></div>
    <div class="soft" [lpgTilt]="tilts.Soft"></div>
  `,
})
class Host {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly tilts = TiltStrength;
}

describe('TiltDirective', () => {
  let fixture: ComponentFixture<Host>;

  const pick = (selector: string): HTMLElement =>
    fixture.nativeElement.querySelector(selector) as HTMLElement;

  const setUp = async (pointerEffects: boolean) => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => pointerEffects,
            pointerEffectsEnabled: () => pointerEffects,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    for (const selector of ['.strong', '.soft']) {
      pick(selector).getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    }
  };

  const enter = (selector: string) => {
    pick(selector).dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
  };

  const move = (selector: string, x: number, y: number) => {
    pick(selector).dispatchEvent(
      Object.assign(new Event('pointermove'), { clientX: x, clientY: y }),
    );
    fixture.detectChanges();
  };

  it('reads a bare attribute as the strong setting', async () => {
    await setUp(true);

    enter('.strong');
    move('.strong', 200, 100); // the far corner

    expect(pick('.strong').style.getPropertyValue('--tilt-y')).toBe('3.600deg');
    expect(pick('.strong').style.getPropertyValue('--tilt-lift')).toBe('-6px');
  });

  it('tilts less, and lifts less, on the soft setting', async () => {
    await setUp(true);

    enter('.soft');
    move('.soft', 200, 100);

    expect(pick('.soft').style.getPropertyValue('--tilt-y')).toBe('2.000deg');
    expect(pick('.soft').style.getPropertyValue('--tilt-lift')).toBe('-4px');
  });

  it('rotates about X against vertical travel, so the near edge comes forward', async () => {
    await setUp(true);

    enter('.strong');
    move('.strong', 100, 100); // bottom centre

    expect(pick('.strong').style.getPropertyValue('--tilt-x')).toBe('-3.600deg');
    expect(pick('.strong').style.getPropertyValue('--tilt-y')).toBe('0.000deg');
  });

  it('publishes the glare position as a percentage of the box', async () => {
    await setUp(true);

    enter('.strong');
    move('.strong', 50, 25);

    expect(pick('.strong').style.getPropertyValue('--glare-x')).toBe('25.0%');
    expect(pick('.strong').style.getPropertyValue('--glare-y')).toBe('25.0%');
  });

  it('flattens on leave', async () => {
    await setUp(true);
    enter('.strong');
    move('.strong', 200, 100);

    pick('.strong').dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();

    expect(pick('.strong').classList.contains('is-tilting')).toBe(false);
    expect(pick('.strong').style.getPropertyValue('--tilt-y')).toBe('0.000deg');
    expect(pick('.strong').style.getPropertyValue('--tilt-lift')).toBe('0px');
  });

  it('ignores a box with no area, which is what a display:contents host reports', async () => {
    await setUp(true);
    pick('.strong').getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);

    enter('.strong');
    move('.strong', 10, 10);

    expect(pick('.strong').style.getPropertyValue('--tilt-y')).toBe('0.000deg');
  });

  it('does nothing when pointer effects are off', async () => {
    await setUp(false);

    enter('.strong');
    move('.strong', 200, 100);

    expect(pick('.strong').classList.contains('is-tilting')).toBe(false);
    expect(pick('.strong').style.getPropertyValue('--tilt-y')).toBe('0.000deg');
  });
});
