import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ControlGlyphs } from '@christian-szasz-portfolio/common-web';

/** The chrome every pop-up shares; the body is projected, so each keeps its own scrolling */
@Component({
  selector: 'lpg-modal-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal-shell.component.html',
  styleUrl: './modal-shell.component.scss',
})
export class ModalShellComponent {
  protected readonly glyphs = ControlGlyphs;

  public readonly heading = input.required<string>();

  /** Ties the dialog to its title for assistive technology */
  public readonly headingId = input.required<string>();

  /** What the close button announces itself as */
  public readonly closeLabel = input('Close');

  public readonly closed = output<void>();

  protected onClose(): void {
    this.closed.emit();
  }
}
