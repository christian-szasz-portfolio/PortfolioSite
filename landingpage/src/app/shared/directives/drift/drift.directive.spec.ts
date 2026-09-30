import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment, ScrollService } from '@christian-szasz-portfolio/common-web';

import { DriftDepth, DriftDirective } from './drift.directive';

@Component({
  imports: [DriftDirective],
  template: `<p class="target" [lpgDrift]="depth()">Nine languages.</p>`,
})
class Host {
  public readonly depth = signal<DriftDepth>(DriftDepth.Medium);
}

interface ScrollState {
  readonly y: number;
  readonly viewport: number;
  readonly document: number;
}

/** The one field the directive reads, without inventing the other twelve */
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
    // Nothing to record: the directive measures the element for itself.
  }

  public disconnect(): void {
    this.disconnected = true;
  }

  public report(isIntersecting: boolean): void {
    this.callback([entry(isIntersecting)], this as unknown as IntersectionObserver);
  }
}

describe('DriftDirective', () => {
  let fixture: ComponentFixture<Host>;
  let original: typeof IntersectionObserver;
  let state: ReturnType<typeof signal<ScrollState>>;

  const target = (): HTMLElement => fixture.nativeElement.querySelector('.target') as HTMLElement;
  const offset = (): string => target().style.getPropertyValue('--drift');

  /** jsdom lays nothing out, so the geometry has to be stated outright */
  const place = (top: number, height: number) => {
    target().getBoundingClientRect = () => new DOMRect(0, top, 800, height);
  };

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

  const settle = (y: number) => {
    state.set({ y, viewport: 900, document: 4000 });
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

  it('rests at zero until the element is on screen', async () => {
    await setUp(true);
    place(400, 200);
    settle(10);

    expect(offset()).toBe('0px');
  });

  it('drifts one way high in the viewport and the other way low in it', async () => {
    await setUp(true);
    ObserverStub.last?.report(true);

    place(0, 200);
    settle(1);
    const high = Number.parseFloat(offset());

    place(800, 200);
    settle(2);
    const low = Number.parseFloat(offset());

    expect(high).toBeGreaterThan(0);
    expect(low).toBeLessThan(0);
  });

  it('stays bounded by its depth however far down the page it is', async () => {
    await setUp(true);
    ObserverStub.last?.report(true);

    place(0, 200);
    settle(12000);

    expect(Math.abs(Number.parseFloat(offset()))).toBeLessThanOrEqual(18);
  });

  it('travels further at a greater depth', async () => {
    await setUp(true);
    ObserverStub.last?.report(true);

    place(0, 200);
    settle(1);
    const medium = Math.abs(Number.parseFloat(offset()));

    fixture.componentInstance.depth.set(DriftDepth.Strong);
    fixture.detectChanges();
    const strong = Math.abs(Number.parseFloat(offset()));

    expect(strong).toBeGreaterThan(medium);
  });

  it('stays still under reduced motion, and never watches for the element', async () => {
    await setUp(false);
    place(0, 200);
    settle(500);

    expect(offset()).toBe('0px');
    expect(ObserverStub.last).toBeNull();
  });

  it('answers zero for an element with no height, rather than dividing by it', async () => {
    await setUp(true);
    ObserverStub.last?.report(true);

    place(0, 0);
    settle(1);

    expect(offset()).toBe('0px');
  });
});
