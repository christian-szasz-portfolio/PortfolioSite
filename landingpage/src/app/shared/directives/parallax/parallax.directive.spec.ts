import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment, ScrollService } from '@christian-szasz-portfolio/common-web';

import { ParallaxDirective } from './parallax.directive';

@Component({
  imports: [ParallaxDirective],
  template: `<span class="target" [lpgParallax]="rate()"></span>`,
})
class Host {
  public readonly rate = signal(0.14);
}

interface ScrollState {
  readonly y: number;
  readonly viewport: number;
  readonly document: number;
}

describe('ParallaxDirective', () => {
  let fixture: ComponentFixture<Host>;
  let state: ReturnType<typeof signal<ScrollState>>;

  const target = (): HTMLElement => fixture.nativeElement.querySelector('.target') as HTMLElement;

  const setUp = async (animations: boolean) => {
    state = signal<ScrollState>({ y: 0, viewport: 900, document: 4000 });

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => animations,
            pointerEffectsEnabled: () => animations,
          },
        },
        { provide: ScrollService, useValue: { state, progress: () => 0 } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const scrollTo = (y: number) => {
    state.set({ y, viewport: 900, document: 4000 });
    fixture.detectChanges();
  };

  it('sits still at the top of the page', async () => {
    await setUp(true);

    expect(target().style.transform).toBe('translate3d(0, 0.0px, 0)');
  });

  it('travels its own fraction of the scroll', async () => {
    await setUp(true);

    scrollTo(1000);

    expect(target().style.transform).toBe('translate3d(0, 140.0px, 0)');
  });

  it('travels the other way for a negative rate', async () => {
    await setUp(true);

    fixture.componentInstance.rate.set(-0.09);
    scrollTo(1000);

    expect(target().style.transform).toBe('translate3d(0, -90.0px, 0)');
  });

  it('follows the scroll as it changes, rather than reading it once', async () => {
    await setUp(true);

    scrollTo(500);
    const half = target().style.transform;

    scrollTo(1000);

    expect(target().style.transform).not.toBe(half);
  });

  it('states no transform at all under reduced motion', async () => {
    await setUp(false);

    scrollTo(1000);

    expect(target().style.transform).toBe('none');
  });
});
