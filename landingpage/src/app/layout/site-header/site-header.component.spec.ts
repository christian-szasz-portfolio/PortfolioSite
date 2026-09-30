import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { BrowserEnvironment, ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { ActiveSectionService } from '../../core/services/site/active-section/active-section.service';
import { CvDialogService } from '../../core/services/dialogs/cv-dialog/cv-dialog.service';
import { ThemeService, Theme, ThemeOrigin } from '../../core/services/site/theme/theme.service';
import { KeyboardKey } from '../../core/utils/keyboard/keyboard.utils';
import { SiteHeaderComponent } from './site-header.component';

class CvDialogStub {
  public calls = 0;
  /** Hands back a stream, because that is what the real service does now */
  public open(): Observable<void> {
    this.calls += 1;
    return of(undefined);
  }
}

class ThemeStub {
  public readonly theme = signal<Theme>(Theme.Dark);
  public readonly isDark = signal(true);
  public readonly toggleLabel = signal('Switch to light');
  public origins: ThemeOrigin[] = [];

  public toggle(origin?: ThemeOrigin): void {
    if (origin !== undefined) {
      this.origins.push(origin);
    }
  }
}

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;
  let dialog: CvDialogStub;
  let theme: ThemeStub;
  const active = signal<string | null>(null);
  let state: ReturnType<typeof signal<ScrollState>>;

  const pick = (selector: string): HTMLElement =>
    fixture.nativeElement.querySelector(selector) as HTMLElement;

  const setUp = async (isBrowser = true) => {
    dialog = new CvDialogStub();
    theme = new ThemeStub();
    state = signal<ScrollState>({ y: 0, viewport: 800, document: 3200 });

    await TestBed.configureTestingModule({
      imports: [SiteHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: CvDialogService, useValue: dialog },
        { provide: ThemeService, useValue: theme },
        { provide: ScrollService, useValue: { state } },
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
          provide: BrowserEnvironment,
          useValue: {
            isBrowser,
            animationsEnabled: () => true,
            pointerEffectsEnabled: () => true,
          },
        },
      ],
    }).compileComponents();

    active.set(null);
    fixture = TestBed.createComponent(SiteHeaderComponent);
    fixture.detectChanges();
  };

  beforeEach(() => setUp());

  it('links every section back to the home page, by fragment', () => {
    const links = [...fixture.nativeElement.querySelectorAll('.site-nav__link')].filter(
      (link: Element) => !link.classList.contains('site-nav__link--cta'),
    ) as HTMLAnchorElement[];

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/#work',
      '/#thinking',
      '/#about',
    ]);
  });

  it('carries both the location and the remote-work caption in the brand', () => {
    const brand = pick('.brand');

    expect(brand.querySelector('.brand__status-face--here')?.textContent?.trim()).toBe(
      'Sibiu, Romania',
    );
    expect(brand.querySelector('.brand__status-face--remote')?.textContent?.trim()).toBe(
      'open to remote work',
    );
  });

  it('marks the section being read', () => {
    active.set('thinking');
    fixture.detectChanges();

    const current = fixture.nativeElement.querySelector('.site-nav__link.is-current');

    expect(current?.textContent?.trim()).toBe('Thinking');
  });

  it('goes into its scrolled state as soon as the page moves', () => {
    expect(pick('.site-header').classList.contains('site-header--scrolled')).toBe(false);

    state.set({ y: 40, viewport: 800, document: 3200 });
    fixture.detectChanges();

    expect(pick('.site-header').classList.contains('site-header--scrolled')).toBe(true);
  });

  it('opens and closes the menu, and reports which it is', () => {
    const toggle = pick('.nav-toggle');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(pick('.site-nav').classList.contains('is-open')).toBe(true);

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu on Escape', () => {
    pick('.nav-toggle').click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: KeyboardKey.Escape }));
    fixture.detectChanges();

    expect(pick('.nav-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  /*
   * The height is published to a global CSS variable, so anything that stomps it breaks every
   * sticky thing below the header. A detached instance measures zero, and a zero here pinned the
   * technology marquee at the top of the page, underneath the header.
   */
  it('never publishes a height of zero', () => {
    const root = document.documentElement;
    root.style.setProperty('--header-height', '74px');

    fixture.destroy();

    expect(root.style.getPropertyValue('--header-height')).toBe('74px');
  });

  it('wipes the theme from the point that was pressed', () => {
    const toggle = pick('.theme-toggle');

    toggle.dispatchEvent(new MouseEvent('click', { clientX: 1200, clientY: 24, bubbles: true }));

    expect(theme.origins).toEqual([{ x: 1200, y: 24 }]);
  });

  it('keeps a real href on the CV, but opens the pop-up on a plain click', () => {
    const cv = pick('.site-nav__link--cta') as HTMLAnchorElement;
    expect(cv.getAttribute('href')).toBe('/cv');

    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    cv.dispatchEvent(event);

    expect(dialog.calls).toBe(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('lets a modified click through, because that means "new tab"', () => {
    const event = new MouseEvent('click', { cancelable: true, bubbles: true, metaKey: true });
    pick('.site-nav__link--cta').dispatchEvent(event);

    expect(dialog.calls).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves the link alone while prerendering, where there is no dialog', async () => {
    TestBed.resetTestingModule();
    await setUp(false);

    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    pick('.site-nav__link--cta').dispatchEvent(event);

    expect(dialog.calls).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
});
