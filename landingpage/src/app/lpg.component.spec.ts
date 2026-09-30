import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AnalyticsService, BrowserEnvironment, PointerPosition, PointerService, ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { LpgComponent } from './lpg.component';
import { ActiveSectionService } from './core/services/site/active-section/active-section.service';

describe('LpgComponent', () => {
  let fixture: ComponentFixture<LpgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LpgComponent],
      providers: [
        provideRouter([]),
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
        {
          provide: ScrollService,
          useValue: {
            state: signal<ScrollState>({ y: 0, viewport: 800, document: 3200 }),
            progress: signal(0),
          },
        },
        {
          provide: PointerService,
          useValue: { position: signal<PointerPosition>({ x: 0, y: 0, active: false }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LpgComponent);
    fixture.detectChanges();
  });

  it('offers a skip link before anything else on the page', () => {
    const first = fixture.nativeElement.firstElementChild as HTMLAnchorElement;

    expect(first.classList.contains('skip-link')).toBe(true);
    expect(first.getAttribute('href')).toBe('/#main');
  });

  it('gives the skip link a target that exists', () => {
    expect(fixture.nativeElement.querySelector('main#main')).not.toBeNull();
  });

  it('puts the routed page inside the landmark, and the chrome outside it', () => {
    const main = fixture.nativeElement.querySelector('main.main') as HTMLElement;

    expect(main.querySelector('router-outlet')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('main lpg-site-header')).toBeNull();
    expect(fixture.nativeElement.querySelector('main lpg-site-footer')).toBeNull();
  });
});

describe('LpgComponent address sync', () => {
  let fixture: ComponentFixture<LpgComponent>;
  const active = signal<string | null>(null);
  let router: Router;

  const hash = (): string => window.location.hash;
  const scroll = signal<ScrollState>({ y: 0, viewport: 800, document: 3200 });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LpgComponent],
      providers: [
        provideRouter([{ path: '', children: [] }]),
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
        { provide: ScrollService, useValue: { state: scroll, progress: signal(0) } },
        {
          provide: ActiveSectionService,
          useValue: {
            active,
            readingLine: () => 0,
            register: () => undefined,
            unregister: () => undefined,
          },
        },
        {
          provide: PointerService,
          useValue: { position: signal<PointerPosition>({ x: 0, y: 0, active: false }) },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    active.set(null);
    scroll.set({ y: 0, viewport: 800, document: 3200 });

    fixture = TestBed.createComponent(LpgComponent);
    fixture.detectChanges();

    await router.navigate(['/']);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname);
  });

  it('puts the section being read into the address', async () => {
    active.set('work');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(hash()).toBe('#work');
  });

  it('keeps whatever query the address carries while it follows the sections', async () => {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?from=cv`);
    active.set('work');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(window.location.search).toBe('?from=cv');
    expect(hash()).toBe('#work');
  });

  it('follows the reader from one section to the next', async () => {
    active.set('work');
    await fixture.whenStable();
    fixture.detectChanges();

    active.set(null);
    active.set('about');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(hash()).toBe('#about');
  });

  it('clears the fragment again above the first section', async () => {
    active.set('work');
    await fixture.whenStable();
    fixture.detectChanges();

    // The reader scrolls back above it, which is what makes the fragment stale
    scroll.set({ y: 120, viewport: 800, document: 3200 });
    active.set(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(hash()).toBe('');
  });

  it('replaces rather than pushes, so the back button is not filled with sections', async () => {
    const before = window.history.length;
    active.set('work');
    await fixture.whenStable();
    fixture.detectChanges();

    active.set(null);
    active.set('about');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(window.history.length).toBe(before);
  });

  it('keeps a fragment the reader arrived with until they scroll from it', async () => {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}#about`);
    await router.navigate(['/'], { fragment: 'about' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(hash()).toBe('#about');
  });
});

describe('LpgComponent reporting', () => {
  let fixture: ComponentFixture<LpgComponent>;
  const active = signal<string | null>(null);
  let router: Router;
  let recorded: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    recorded = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LpgComponent],
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'cv', children: [] },
        ]),
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
        {
          provide: ScrollService,
          useValue: {
            state: signal<ScrollState>({ y: 0, viewport: 800, document: 3200 }),
            progress: signal(0),
          },
        },
        {
          provide: ActiveSectionService,
          useValue: {
            active,
            readingLine: () => 0,
            register: () => undefined,
            unregister: () => undefined,
          },
        },
        {
          provide: PointerService,
          useValue: { position: signal<PointerPosition>({ x: 0, y: 0, active: false }) },
        },
        { provide: AnalyticsService, useValue: { record: recorded } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    active.set(null);

    fixture = TestBed.createComponent(LpgComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname);
  });

  it('counts a page as it is opened', async () => {
    await router.navigate(['/cv']);
    await fixture.whenStable();

    expect(recorded).toHaveBeenCalledWith('route', '/cv');
  });

  // The shell writes the section into the address as the reader scrolls, so this is the
  // scrolling: reaching a section is the thing worth counting, not the pixels it took.
  it('counts a section as the reader reaches it', async () => {
    await router.navigate(['/']);
    await fixture.whenStable();
    active.set('work');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(recorded).toHaveBeenCalledWith('section', 'work');
  });

  it('says nothing about a reader who is above every section', async () => {
    await router.navigate(['/']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(recorded).not.toHaveBeenCalledWith('section', expect.anything());
  });
});
