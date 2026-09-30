import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackendStatusService, ConsentService, ConsentStatus } from '@christian-szasz-portfolio/common-web';

import { CookiesDialogService } from '../../../../core/services/dialogs/cookies-dialog/cookies-dialog.service';

/** Asks once whether to count the visit, after hydration and only while the choice is unset */
@Component({
  selector: 'lpg-consent-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consent-banner.component.html',
  styleUrl: './consent-banner.component.scss',
})
export class ConsentBannerComponent {
  private readonly consent = inject(ConsentService);
  private readonly status = inject(BackendStatusService);
  private readonly cookiesDialog = inject(CookiesDialogService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly ready = signal(false);

  protected readonly visible = computed(
    () =>
      this.ready() && this.consent.status() === ConsentStatus.Unset && !this.status.unavailable(),
  );

  public constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  protected accept(): void {
    this.consent.grant();
  }

  protected decline(): void {
    this.consent.deny();
  }

  /** The notice is a pop-up with no page behind it, so this is a button. */
  protected openDetails(): void {
    this.cookiesDialog.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
