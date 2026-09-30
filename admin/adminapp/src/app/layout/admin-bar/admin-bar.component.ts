import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { SyncReport } from '../../data';

/** The bar across the top: what is being read, and the one button that reaches the network. */
@Component({
  selector: 'adm-admin-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-bar.component.html',
  styleUrl: './admin-bar.component.scss',
})
export class AdminBarComponent {
  /** The folder on this machine the figures were read from, or null before the first read. */
  public readonly archiveLocation = input<string | null>(null);

  /** Which storage those figures were synced from, in words. */
  public readonly source = input('');

  /** Whether that storage is the real one, told before anybody reads a number. */
  public readonly live = input(false);

  /** What the last sync did, or null if none has run this session. */
  public readonly report = input<SyncReport | null>(null);

  public readonly busy = input(false);

  /** Pressed. The shell decides what syncing means; the bar only says it was asked for. */
  public readonly sync = output<void>();
}
