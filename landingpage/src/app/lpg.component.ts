import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AnalyticsService, BrowserEnvironment, CursorComponent, GrainComponent, ScrollProgressComponent, ScrollService } from '@christian-szasz-portfolio/common-web';
import { filter, map } from 'rxjs';

// Straight from its file, not the data barrel: see data/index.ts
import { interaction } from './data/interaction.data';
import { ActiveSectionService } from './core/services/site/active-section/active-section.service';
import { CurrentPathService } from './core/services/platform/current-path/current-path.service';
import { WakeService } from './core/services/site/wake/wake.service';
import { SiteFooterComponent } from './layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from './layout/site-header/site-header.component';
import { ConsentBannerComponent } from './shared/components/overlay/consent-banner/consent-banner.component';
import { StatusBannerComponent } from './shared/components/overlay/status-banner/status-banner.component';

/** The path alone: the query carries the language and the fragment carries the section */
function pathOf(url: string): string {
  return url.split('?')[0]?.split('#')[0] ?? url;
}

/** The shell: everything that outlives a route change */
@Component({
  selector: 'lpg-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SiteHeaderComponent,
    SiteFooterComponent,
    ConsentBannerComponent,
    StatusBannerComponent,
    CursorComponent,
    GrainComponent,
    ScrollProgressComponent,
  ],
  templateUrl: './lpg.component.html',
  styleUrl: './lpg.component.scss',
})
export class LpgComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly scroller = inject(ViewportScroller);
  private readonly environment = inject(BrowserEnvironment);
  private readonly analytics = inject(AnalyticsService);
  private readonly wake = inject(WakeService);

  /** Which section is being read, from the spies on the sections themselves */
  private readonly sections = inject(ActiveSectionService);
  private readonly section = this.sections.active;
  private readonly scroll = inject(ScrollService);

  /** Where the page stood when the last navigation ended, to tell the reader moving from not */
  private readonly arrivedAt = signal<number | null>(null);
  private readonly currentPath = inject(CurrentPathService);

  /** True once the router has actually resolved a route */
  private readonly routed = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => true),
    ),
    { initialValue: false },
  );

  /** The path in full: `<base href>` makes a bare `#main` resolve against the base, not the page */
  protected readonly skipHref = computed(() => `${this.currentPath.path()}#main`);

  public constructor() {
    // A page open and a section reached are both route changes here, since scrolling rewrites
    // the address; counted separately since they are different things to ask about.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.arrivedAt.set(this.document.defaultView?.scrollY ?? 0);
        this.analytics.record(interaction.route, pathOf(event.urlAfterRedirects));
      });

    effect(() => {
      const section = this.section();

      if (section !== null) {
        this.analytics.record(interaction.section, section);
      }
    });

    // The address follows the reader: without this, scrolling to a section left the URL
    // pointing elsewhere. Uses `replaceState`, not a navigation, or the router would scroll to
    // the fragment and fight the scroll that caused it, and every section would land in history.
    effect(() => {
      const section = this.section();
      const view = this.document.defaultView;

      // Not before the router settles, or /work/stack86 went to the home page
      if (!this.environment.isBrowser || !this.routed() || view === null) {
        return;
      }

      // A fragment nobody has scrolled from yet is where the reader is headed, not stale
      if (section === null && this.scroll.state().y === this.arrivedAt()) {
        return;
      }

      // Rebuilt from the whole query, or the first scroll loses the reader's language
      const base = `${view.location.pathname}${view.location.search}`;
      const next = section === null ? base : `${base}#${section}`;

      if (next === `${base}${view.location.hash}`) {
        return;
      }

      // The browser's history, not Angular's Location, which would make the router navigate
      view.history.replaceState(view.history.state, '', next);
    });

    afterNextRender(() => {
      // Angular's anchor scroll ignores `scroll-margin-top`, so it is given the line the section
      // spy reads from: a section scrolled to is then the section being read
      this.scroller.setOffset(() => [0, this.sections.readingLine()]);

      // After the first paint, so the wake never competes with the page itself
      this.wake.wakeAll();
    });
  }
}
