import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { CounterDirective } from './counter.directive';

@Component({
  imports: [CounterDirective],
  template: `
    <span class="count" [lpgCounter]="2700"></span>
    <span class="year" [lpgCounter]="2021" [plain]="true"></span>
  `,
})
class Host {}

/** The one field these directives read, without inventing the other twelve */
function entry(isIntersecting: boolean): IntersectionObserverEntry {
  const partial: Partial<IntersectionObserverEntry> = { isIntersecting };
  return partial as IntersectionObserverEntry;
}

class ObserverStub {
  public static last: ObserverStub | null = null;
  public disconnected = false;

  public constructor(private readonly callback: IntersectionObserverCallback) {
    ObserverStub.last = this;
  }

  public observe(): void {
    /** The callback is driven by hand */
  }

  public disconnect(): void {
    this.disconnected = true;
  }

  public enter(): void {
    this.callback([entry(true)], this as unknown as IntersectionObserver);
  }
}

describe('CounterDirective', () => {
  let fixture: ComponentFixture<Host>;
  let original: typeof IntersectionObserver;

  const pick = (selector: string): HTMLElement =>
    fixture.nativeElement.querySelector(selector) as HTMLElement;

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

  it('shows the declared figure before anything has scrolled into view', async () => {
    await setUp(true);

    expect(pick('.count').textContent).toBe('2,700');
  });

  it('leaves a plain value unformatted, because a year is not a quantity', async () => {
    await setUp(true);

    expect(pick('.year').textContent).toBe('2021');
  });

  it('stops watching once it has started counting', async () => {
    await setUp(true);

    ObserverStub.last?.enter();

    expect(ObserverStub.last?.disconnected).toBe(true);
  });

  it('arrives at exactly the declared figure when the count finishes', async () => {
    await setUp(true);
    ObserverStub.last?.enter();

    await new Promise((resolve) => setTimeout(resolve, 1600));
    fixture.detectChanges();

    expect(pick('.count').textContent).toBe('2,700');
  });

  it('never observes anything under reduced motion', async () => {
    await setUp(false);

    expect(ObserverStub.last).toBeNull();
    expect(pick('.count').textContent).toBe('2,700');
  });
});
