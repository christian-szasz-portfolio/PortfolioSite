import { TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { Theme, ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', Theme.Dark);
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts from the attribute the pre-paint script left behind', () => {
    document.documentElement.setAttribute('data-theme', Theme.Light);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe(Theme.Light);
    expect(service.isDark()).toBe(false);
  });

  it('labels the action rather than the current state', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe(Theme.Dark);
    expect(service.toggleLabel()).toBe('Switch to light');
  });

  it('mirrors the theme onto the document and into storage', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle();
    TestBed.tick(); // flush the effect

    expect(service.theme()).toBe(Theme.Light);
    expect(service.toggleLabel()).toBe('Switch to dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe(Theme.Light);
    expect(localStorage.getItem('cs-theme')).toBe(Theme.Light);
  });

  it('toggles back', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle();
    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe(Theme.Dark);
    expect(localStorage.getItem('cs-theme')).toBe(Theme.Dark);
  });
});

describe('ThemeService wipe direction', () => {
  let started: number;
  let finish: () => void;

  /** jsdom has no view transitions, so one is stood up by hand */
  const stubViewTransition = () => {
    started = 0;

    const start = (callback: () => void) => {
      started += 1;
      callback();

      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });

      // Only the two members the service touches are real; the rest are shape.
      const stub = {
        finished,
        ready: finished,
        updateCallbackDone: finished,
        skipTransition: () => undefined,
      };

      return stub as unknown as ViewTransition;
    };

    document.startViewTransition = start as typeof document.startViewTransition;
  };

  const classes = () => [...document.documentElement.classList];

  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', Theme.Dark);
    document.documentElement.className = '';
    localStorage.clear();
    stubViewTransition();
    TestBed.configureTestingModule({
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
    });
  });

  afterEach(() => {
    // Removed outright: the service tests for the key's presence, not its value
    Reflect.deleteProperty(document, 'startViewTransition');
    document.documentElement.className = '';
  });

  it('opens the new theme out when going to light', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle({ x: 100, y: 20 });

    expect(started).toBe(1);
    expect(classes()).toContain('is-theme-wiping');
    expect(classes()).toContain('is-theme-wiping--to-light');
    expect(classes()).not.toContain('is-theme-wiping--to-dark');
  });

  it('runs the opposite way when going to dark', () => {
    document.documentElement.setAttribute('data-theme', Theme.Light);
    const service = TestBed.inject(ThemeService);

    service.toggle({ x: 100, y: 20 });

    expect(classes()).toContain('is-theme-wiping--to-dark');
    expect(classes()).not.toContain('is-theme-wiping--to-light');
  });

  it('anchors the circle on the point that was pressed', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle({ x: 240, y: 36 });

    expect(document.documentElement.style.getPropertyValue('--vt-x')).toBe('240px');
    expect(document.documentElement.style.getPropertyValue('--vt-y')).toBe('36px');
    expect(document.documentElement.style.getPropertyValue('--vt-r')).not.toBe('');
  });

  it('takes the direction class off again once the transition ends', async () => {
    const service = TestBed.inject(ThemeService);

    service.toggle({ x: 10, y: 10 });
    finish();
    await Promise.resolve();
    await Promise.resolve();

    expect(classes()).not.toContain('is-theme-wiping');
    expect(classes()).not.toContain('is-theme-wiping--to-light');
  });
});
