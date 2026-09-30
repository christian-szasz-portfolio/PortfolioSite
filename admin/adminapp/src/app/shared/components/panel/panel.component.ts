import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A titled box: the one frame every chart and table on the page sits in. */
@Component({
  selector: 'adm-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'panel' },
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss',
})
export class PanelComponent {
  public readonly heading = input.required<string>();

  /** The line under the heading that says how to read what is below. Optional. */
  public readonly note = input<string>('');
}
