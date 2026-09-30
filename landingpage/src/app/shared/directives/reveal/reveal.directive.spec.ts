import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { RevealDirective, RevealVariant } from './reveal.directive';

@Component({
  imports: [RevealDirective],
  template: `<p class="target" lpgReveal>A modular monolith.</p>`,
})
class Host {}

@Component({
  imports: [RevealDirective],
  template: `<p class="target" [lpgReveal]="variant()" [revealDelay]="delay()">Nine languages.</p>`,
})
class VariantHost {
  public readonly variant = signal<RevealVariant>(RevealVariant.Scale);
  public readonly delay = signal(0);
}

/** The one field these directives read, without inventing the other twelve */
function entry(isIntersecting: boolean): IntersectionObserverEntry {
  const partial: Partial<IntersectionObserverEntry> = { isIntersecting };
  return partial as IntersectionObserverEntry;
}

class ObserverStub {
  public static last: ObserverStub | null = null;
  public disconnected = false;
  public observed: Element[] = [];

  public constructor(private readonly callback: IntersectionObserverCallback) {
    ObserverStub.last = this;
  }

  public observe(element: Element): void {
    this.observed.push(element);
  }

  public disconnect(): void {
    this.disconnected = true;
  }

  public enter(): void {
    this.callback([entry(true)], this as unknown as IntersectionObserver);
  }
}

describe('RevealDirective', () => {
  let fixture: ComponentFixture<Host>;
  let original: typeof IntersectionObserver;

  const target = (): HTMLElement => fixture.nativeElement.querySelector('.target') as HTMLElement;

  const setUp = async (animations: boolean) => {
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
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    original = globalThis.IntersectionObserver;
    ObserverStub.last = null;
    globalThis.IntersectionObserver = ObserverStub as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = original;
  });

  it('arms the element and waits, rather than revealing it at once', async () => {
    await setUp(true);

    expect(target().classList.contains('is-reveal-armed')).toBe(true);
    expect(target().classList.contains('is-revealed')).toBe(false);
  });

  it('reveals on the first intersection and stops watching', async () => {
    await setUp(true);

    ObserverStub.last?.enter();
    fixture.detectChanges();

    expect(target().classList.contains('is-revealed')).toBe(true);
    expect(ObserverStub.last?.disconnected).toBe(true);
  });

  it('shows the element outright under reduced motion, and never arms it', async () => {
    await setUp(false);

    expect(target().classList.contains('is-revealed')).toBe(true);
    expect(target().classList.contains('is-reveal-armed')).toBe(false);
    expect(ObserverStub.last).toBeNull();
  });

  it('states the default variant, so a bare lpgReveal still has one to draw', async () => {
    await setUp(true);

    expect(target().getAttribute('data-reveal')).toBe(RevealVariant.Rise);
  });
});

describe('RevealDirective variants', () => {
  let fixture: ComponentFixture<VariantHost>;
  let original: typeof IntersectionObserver;

  const target = (): HTMLElement => fixture.nativeElement.querySelector('.target') as HTMLElement;

  const setUp = async () => {
    await TestBed.configureTestingModule({
      imports: [VariantHost],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => true,
            pointerEffectsEnabled: () => true,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VariantHost);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    original = globalThis.IntersectionObserver;
    ObserverStub.last = null;
    globalThis.IntersectionObserver = ObserverStub as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = original;
  });

  it('puts the asked-for variant where the stylesheet can key on it', async () => {
    await setUp();

    expect(target().getAttribute('data-reveal')).toBe(RevealVariant.Scale);
  });

  it('follows the variant when it changes', async () => {
    await setUp();

    fixture.componentInstance.variant.set(RevealVariant.SlideLeft);
    fixture.detectChanges();

    expect(target().getAttribute('data-reveal')).toBe(RevealVariant.SlideLeft);
  });

  it('writes the delay as a custom property in milliseconds', async () => {
    await setUp();

    fixture.componentInstance.delay.set(180);
    fixture.detectChanges();

    expect(target().style.getPropertyValue('--reveal-delay')).toBe('180ms');
  });

  it('asks for no delay by default, rather than leaving the property unset', async () => {
    await setUp();

    expect(target().style.getPropertyValue('--reveal-delay')).toBe('0ms');
  });
});
