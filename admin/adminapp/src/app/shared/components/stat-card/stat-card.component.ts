import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One headline number, with the colour on an edge rather than on the value. */
@Component({
  selector: 'adm-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card', '[style.border-left-color]': 'accent()' },
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  public readonly value = input.required<number>();
  public readonly label = input.required<string>();

  /** The edge colour, chosen by the caller from the palette rather than named here. */
  public readonly accent = input.required<string>();
}
