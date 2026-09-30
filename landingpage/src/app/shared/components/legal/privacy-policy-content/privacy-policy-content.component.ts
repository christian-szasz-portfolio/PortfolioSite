import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CookiesDialogService } from '../../../../core/services/dialogs/cookies-dialog/cookies-dialog.service';

/** The privacy-policy text, shown on the /privacy page. */
@Component({
  selector: 'lpg-privacy-policy-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-policy-content.component.html',
})
export class PrivacyPolicyContentComponent {
  private readonly cookies = inject(CookiesDialogService);
  private readonly destroyRef = inject(DestroyRef);

  /** The cookies notice has no page of its own, so the text opens it here. */
  protected openCookies(): void {
    this.cookies.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
