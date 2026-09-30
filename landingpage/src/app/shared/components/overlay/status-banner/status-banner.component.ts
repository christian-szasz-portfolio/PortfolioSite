import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackendStatusService } from '@christian-szasz-portfolio/common-web';

import { CookiesDialogService } from '../../../../core/services/dialogs/cookies-dialog/cookies-dialog.service';
import { IconComponent } from '../../marks/icon/icon.component';

/**
 * Says visitor statistics are unavailable, and where they are explained. Always mounted, never `@if`-removed, so its
 * height can be published (0 while hidden) for the header to sit below it, the same way the
 * header publishes its own height for the technology band.
 */
@Component({
  selector: 'lpg-status-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './status-banner.component.html',
  styleUrl: './status-banner.component.scss',
})
export class StatusBannerComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly shell = viewChild.required<ElementRef<HTMLElement>>('shell');
  private readonly cookiesDialog = inject(CookiesDialogService);

  protected readonly status = inject(BackendStatusService);

  public constructor() {
    afterNextRender(() => {
      const element = this.shell().nativeElement;
      const publish = (): void => {
        if (!element.isConnected) {
          return;
        }

        const height = Math.round(element.getBoundingClientRect().height);
        this.document.documentElement.style.setProperty('--status-banner-height', `${height}px`);
      };

      publish();

      const observer = new ResizeObserver(publish);
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected close(): void {
    this.status.dismiss();
  }

  /** The statistics are explained in the cookies notice, a pop-up with no page behind it. */
  protected learnMore(): void {
    this.cookiesDialog.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
