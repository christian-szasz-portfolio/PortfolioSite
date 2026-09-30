import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService, BrandMarkComponent, BrowserEnvironment, ScrollService, ThemeGlyphs, WifiGlyphs } from '@christian-szasz-portfolio/common-web';

import { ActiveSectionService } from '../../core/services/site/active-section/active-section.service';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Straight from its file, not the data barrel: see data/index.ts
import { interaction } from '../../data/interaction.data';
import { CvDialogService } from '../../core/services/dialogs/cv-dialog/cv-dialog.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeService } from '../../core/services/site/theme/theme.service';
import { IconComponent } from '../../shared/components/marks/icon/icon.component';
import { ViewCounterComponent } from '../../shared/components/lists/view-counter/view-counter.component';
import { IconName } from '../../shared/components/marks/icon/icon.registry';
import { MagneticDirective } from '../../shared/directives/magnetic/magnetic.directive';

interface NavItem {
  readonly label: string;
  readonly fragment: string;
  readonly icon: IconName;
}

const NAV: readonly NavItem[] = [
  { label: $localize`:@@nav.work.label:Work`, fragment: 'work', icon: 'work' },
  { label: $localize`:@@nav.thinking.label:Thinking`, fragment: 'thinking', icon: 'thinking' },
  { label: $localize`:@@nav.about.label:About`, fragment: 'about', icon: 'about' },
];

@Component({
  selector: 'lpg-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BrandMarkComponent,
    IconComponent,
    LanguageSwitcherComponent,
    MagneticDirective,
    RouterLink,
    ViewCounterComponent,
  ],
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent {
  protected readonly wifiGlyphs = WifiGlyphs;
  protected readonly themeGlyphs = ThemeGlyphs;

  protected readonly nav = NAV;
  /** Through the base href, so the German build points at /de-DE/cv, not the English page */
  protected readonly cvHref = inject(Location).prepareExternalUrl('/cv');
  protected readonly theme = inject(ThemeService);

  /** The real header element: the host is `display: contents` and has no box */
  private readonly shell = viewChild.required<ElementRef<HTMLElement>>('shell');

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scroll = inject(ScrollService);
  private readonly environment = inject(BrowserEnvironment);
  private readonly cvDialog = inject(CvDialogService);
  private readonly analytics = inject(AnalyticsService);

  /** Which section is currently being read, for the nav marker */
  protected readonly active = inject(ActiveSectionService).active;

  protected readonly menuOpen = signal(false);
  protected readonly scrolled = computed(() => this.scroll.state().y > 8);

  public constructor() {
    // Published so anything sticking below the header knows where it ends.
    afterNextRender(() => {
      const element = this.shell().nativeElement;

      // Never publishes a zero height: a detached instance's observer still fires with a rect
      // of zero and the global variable's last write wins, which pinned the marquee under a
      // vanished header.
      const publish = (): void => {
        if (!element.isConnected) {
          return;
        }

        const height = Math.round(element.getBoundingClientRect().height);
        if (height === 0) {
          return;
        }

        this.document.documentElement.style.setProperty('--header-height', `${height}px`);
      };

      publish();

      const observer = new ResizeObserver(publish);
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onToggleTheme(event: MouseEvent): void {
    this.theme.toggle({ x: event.clientX, y: event.clientY });
  }

  protected openCv(event: MouseEvent): void {
    // A modified click is a deliberate request for a new tab: leave it alone.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (!this.environment.isBrowser) {
      return;
    }

    event.preventDefault();
    this.closeMenu();
    this.analytics.record(interaction.cvOpened);
    this.cvDialog.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
