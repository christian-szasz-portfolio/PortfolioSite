import { DOCUMENT, Service, computed, effect, inject, signal } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

/** Where the theme wipe starts from, in viewport pixels */
export interface ThemeOrigin {
  readonly x: number;
  readonly y: number;
}

const STORAGE_KEY = 'cs-theme';

/** One writable signal, mirrored onto the document and into storage */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly environment = inject(BrowserEnvironment);

  private readonly current = signal<Theme>(this.readInitial());

  public readonly theme = this.current.asReadonly();
  public readonly isDark = computed(() => this.current() === Theme.Dark);
  /** Labels describe the action the press will take, not the state we are in */
  public readonly toggleLabel = computed(() =>
    this.isDark()
      ? $localize`:@@theme.toLight.cta:Switch to light`
      : $localize`:@@theme.toDark.cta:Switch to dark`,
  );

  public constructor() {
    effect(() => {
      const theme = this.current();
      // setAttribute, because the prerender DOM has no dataset
      this.document.documentElement.setAttribute('data-theme', theme);

      if (!this.environment.isBrowser) {
        return;
      }

      try {
        this.document.defaultView?.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /** Private browsing rejects writes */
      }
    });
  }

  /** Flips the theme, wiping it in from the point given */
  public toggle(origin?: ThemeOrigin): void {
    const next: Theme = this.current() === Theme.Dark ? Theme.Light : Theme.Dark;
    const view = this.document.defaultView;

    // Typed by the DOM lib but absent in some browsers, so checked at runtime
    if (
      !this.environment.animationsEnabled() ||
      view === null ||
      !('startViewTransition' in this.document)
    ) {
      this.current.set(next);
      return;
    }

    const root = this.document.documentElement;
    const x = origin?.x ?? view.innerWidth / 2;
    const y = origin?.y ?? 0;
    const radius = Math.hypot(Math.max(x, view.innerWidth - x), Math.max(y, view.innerHeight - y));

    root.style.setProperty('--vt-x', `${x}px`);
    root.style.setProperty('--vt-y', `${y}px`);
    root.style.setProperty('--vt-r', `${radius}px`);
    // The direction is on the class, the two wipes running opposite ways round
    const direction =
      next === Theme.Light ? 'is-theme-wiping--to-light' : 'is-theme-wiping--to-dark';
    root.classList.add('is-theme-wiping', direction);

    const transition = this.document.startViewTransition(() => this.current.set(next));
    void transition.finished.finally(() => {
      root.classList.remove('is-theme-wiping', direction);
    });
  }

  private readInitial(): Theme {
    const attribute = this.document.documentElement.getAttribute('data-theme');
    return attribute === Theme.Light ? Theme.Light : Theme.Dark;
  }
}
