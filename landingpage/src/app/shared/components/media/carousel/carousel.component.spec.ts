import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { CarouselComponent } from './carousel.component';

@Component({
  imports: [CarouselComponent],
  template: `
    <lpg-carousel label="Projects">
      <div class="carousel-slide">one</div>
      <div class="carousel-slide">two</div>
      <div class="carousel-slide">three</div>
    </lpg-carousel>
  `,
})
class Host {}

describe('CarouselComponent', () => {
  let fixture: ComponentFixture<Host>;
  let scrolledBy: ScrollToOptions[];

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const track = (): HTMLElement => element().querySelector('.carousel__track') as HTMLElement;

  /** jsdom lays nothing out, so the track's geometry is stated; the slides split the content */
  const lay = (client: number, scroll: number, left = 0, stops = [0, client, scroll - client]) => {
    element()
      .querySelectorAll<HTMLElement>('.carousel-slide')
      .forEach((slide, index) => {
        Object.defineProperty(slide, 'offsetLeft', { value: stops[index], configurable: true });
      });
    Object.defineProperty(track(), 'clientWidth', { value: client, configurable: true });
    Object.defineProperty(track(), 'scrollWidth', { value: scroll, configurable: true });
    Object.defineProperty(track(), 'scrollLeft', {
      value: left,
      writable: true,
      configurable: true,
    });
  };

  const setUp = async (animations = true) => {
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    scrolledBy = [];
    track().scrollBy = (options?: number | ScrollToOptions) => {
      if (typeof options === 'object' && options !== null) {
        scrolledBy.push(options);
      }
    };

    lay(500, 1500);
    await fixture.whenStable();
    track().dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  };

  beforeEach(() => setUp());

  it('is a named carousel region, and says so to assistive tech', () => {
    const group = element().querySelector('[role="group"]') as HTMLElement;

    expect(group.getAttribute('aria-roledescription')).toBe('carousel');
    expect(group.getAttribute('aria-label')).toBe('Projects');
  });

  it('keeps every slide in the DOM, so the page prerenders whole', () => {
    expect(element().querySelectorAll('.carousel-slide').length).toBe(3);
    expect(element().textContent).toContain('one');
    expect(element().textContent).toContain('three');
  });

  it('makes the track itself focusable, so it can be scrolled from the keyboard', () => {
    expect(track().getAttribute('tabindex')).toBe('0');
    expect(track().getAttribute('aria-label')).toContain('Projects');
  });

  it('offers one dot per slide once the content overflows', () => {
    expect(element().querySelectorAll('.carousel__dot').length).toBe(3);
    expect(element().querySelectorAll('.carousel__button').length).toBe(2);
  });

  it('hides the controls entirely when everything already fits', async () => {
    lay(1500, 1500);
    window.dispatchEvent(new Event('resize'));
    track().dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    // Nothing to page through, so the affordance would be a lie.
    expect(element().querySelector('.carousel__controls')).toBeNull();
  });

  it('disables previous at the start and next at the end', () => {
    const [previous, next] = [
      ...element().querySelectorAll<HTMLButtonElement>('.carousel__button'),
    ];

    expect(previous?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);

    lay(500, 1500, 1000);
    track().dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(element().querySelectorAll<HTMLButtonElement>('.carousel__button')[1]?.disabled).toBe(
      true,
    );
  });

  it('disables next at the last slide even when its snap stops short of the very end', () => {
    // The scroll padding holds the last slide a few pixels before the track can end
    lay(500, 1500, 996, [0, 498, 996]);
    track().dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(element().querySelectorAll<HTMLButtonElement>('.carousel__button')[1]?.disabled).toBe(
      true,
    );
  });

  it('pages forward by most of a track width', () => {
    const next = [...element().querySelectorAll<HTMLButtonElement>('.carousel__button')][1];
    next?.click();

    expect(scrolledBy.length).toBe(1);
    expect(scrolledBy[0]?.left).toBeGreaterThan(0);
  });

  it('pages backward when asked', () => {
    lay(500, 1500, 600);
    track().dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    const previous = [...element().querySelectorAll<HTMLButtonElement>('.carousel__button')][0];
    previous?.click();

    expect(scrolledBy[0]?.left).toBeLessThan(0);
  });

  it('scrolls smoothly when motion is welcome', () => {
    [...element().querySelectorAll<HTMLButtonElement>('.carousel__button')][1]?.click();

    expect(scrolledBy[0]?.behavior).toBe('smooth');
  });

  it('jumps instantly when motion is not', async () => {
    TestBed.resetTestingModule();
    await setUp(false);

    [...element().querySelectorAll<HTMLButtonElement>('.carousel__button')][1]?.click();

    expect(scrolledBy[0]?.behavior).toBe('instant');
  });

  it('marks the first dot as current before anything has scrolled', () => {
    const current = element().querySelector('.carousel__dot.is-current');

    expect(current?.getAttribute('aria-label')).toBe('Go to 1 of 3');
    expect(current?.getAttribute('aria-current')).toBe('true');
  });
});
