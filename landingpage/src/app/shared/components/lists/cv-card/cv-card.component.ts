import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';

import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArrowGlyphs, BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { CvDialogService } from '../../../../core/services/dialogs/cv-dialog/cv-dialog.service';
import { MagneticDirective } from '../../../directives/magnetic/magnetic.directive';
import { TiltDirective, TiltStrength } from '../../../directives/tilt/tilt.directive';

/** The CV card; its anchor keeps a real href for the no-script case */
@Component({
  selector: 'lpg-cv-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MagneticDirective, TiltDirective],
  templateUrl: './cv-card.component.html',
  styleUrl: './cv-card.component.scss',
})
export class CvCardComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly tilts = TiltStrength;

  protected readonly glyphs = ArrowGlyphs;

  /** Through the base href, so the German build points at /de-DE/cv, not the English page */
  protected readonly href = inject(Location).prepareExternalUrl('/cv');

  private readonly cvDialog = inject(CvDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly environment = inject(BrowserEnvironment);

  protected open(event: MouseEvent): void {
    // A modified click is a deliberate request for a new tab: leave it alone.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (!this.environment.isBrowser) {
      return;
    }

    event.preventDefault();
    this.cvDialog.open().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
