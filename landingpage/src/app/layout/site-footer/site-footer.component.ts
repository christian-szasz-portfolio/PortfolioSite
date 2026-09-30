import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { CookiesDialogService } from '../../core/services/dialogs/cookies-dialog/cookies-dialog.service';
import { CurrentPathService } from '../../core/services/platform/current-path/current-path.service';
import { SitemapDialogService } from '../../core/services/dialogs/sitemap-dialog/sitemap-dialog.service';
import { IconComponent } from '../../shared/components/marks/icon/icon.component';
import { TechIconComponent } from '../../shared/components/marks/tech-icon/tech-icon.component';

@Component({
  selector: 'lpg-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, RouterLink, TechIconComponent],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  private readonly environment = inject(BrowserEnvironment);
  private readonly sitemap = inject(SitemapDialogService);
  private readonly cookies = inject(CookiesDialogService);
  private readonly scroller = inject(ViewportScroller);
  private readonly currentPath = inject(CurrentPathService);
  private readonly destroyRef = inject(DestroyRef);

  /** This page from the start; `/#top` used to send a project page's reader to the home hero */
  protected readonly topHref = computed(() => this.currentPath.path());

  protected scrollToTop(event: MouseEvent): void {
    // A modified click is a deliberate request for a new tab: leave it alone.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (!this.environment.isBrowser) {
      return;
    }

    event.preventDefault();
    this.scroller.scrollToPosition([0, 0]);
  }

  protected openSitemap(event: MouseEvent): void {
    // A modified click is a deliberate request for a new tab: leave it alone.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (!this.environment.isBrowser) {
      return;
    }

    event.preventDefault();
    this.sitemap.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** The cookies notice lives only here, so this is a button rather than a link to a page. */
  protected openCookies(): void {
    this.cookies.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
