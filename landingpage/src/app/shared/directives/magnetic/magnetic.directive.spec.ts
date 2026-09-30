import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { MagneticDirective } from './magnetic.directive';

@Component({
  imports: [MagneticDirective],
  template: `<button class="target" type="button" lpgMagnetic>Press</button>`,
})
class Host {}

describe('MagneticDirective', () => {
  let fixture: ComponentFixture<Host>;

  const target = (): HTMLElement => fixture.nativeElement.querySelector('.target') as HTMLElement;

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

    // jsdom lays nothing out, so the box is stated rather than measured.
    target().getBoundingClientRect = () => new DOMRect(100, 100, 200, 100);
  };

  const move = (x: number, y: number) => {
    target().dispatchEvent(Object.assign(new Event('pointermove'), { clientX: x, clientY: y }));
    fixture.detectChanges();
  };

  it('starts with no pull at all', async () => {
    await setUp(true);

    expect(target().style.getPropertyValue('--pull-x')).toBe('0.00px');
    expect(target().style.getPropertyValue('--pull-y')).toBe('0.00px');
  });

  it('pulls toward the pointer, in proportion to the distance from the centre', async () => {
    await setUp(true);

    move(220, 150); // 20px right of centre, level with it

    expect(target().style.getPropertyValue('--pull-x')).toBe('4.40px');
    expect(target().style.getPropertyValue('--pull-y')).toBe('0.00px');
  });

  it('stops at the travel limit however far away the pointer is', async () => {
    await setUp(true);

    move(2000, 2000);

    expect(target().style.getPropertyValue('--pull-x')).toBe('8.00px');
    expect(target().style.getPropertyValue('--pull-y')).toBe('8.00px');
  });

  it('lets go on leave', async () => {
    await setUp(true);
    move(220, 150);

    target().dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();

    expect(target().style.getPropertyValue('--pull-x')).toBe('0.00px');
  });

  it('does not move at all when pointer effects are off', async () => {
    await setUp(false);

    move(220, 150);

    expect(target().style.getPropertyValue('--pull-x')).toBe('0.00px');
  });
});
