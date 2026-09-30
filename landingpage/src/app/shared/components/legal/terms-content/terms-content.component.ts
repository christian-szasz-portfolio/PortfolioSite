import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CookiesDialogService } from '../../../../core/services/dialogs/cookies-dialog/cookies-dialog.service';

/** The terms-and-conditions text, shown on the /terms page. */
@Component({
  selector: 'lpg-terms-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './terms-content.component.html',
})
export class TermsContentComponent {
  private readonly cookies = inject(CookiesDialogService);
  private readonly destroyRef = inject(DestroyRef);

  /** The cookies notice has no page of its own, so the text opens it here. */
  protected openCookies(): void {
    this.cookies.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
