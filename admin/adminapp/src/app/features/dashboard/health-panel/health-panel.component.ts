import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Health } from '../../../data';
import { PanelComponent } from '../../../shared/components/panel/panel.component';

/** Whether the API is answering, and when each of its workers last ran. */
@Component({
  selector: 'adm-health-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelComponent],
  templateUrl: './health-panel.component.html',
  styleUrl: './health-panel.component.scss',
})
export class HealthPanelComponent {
  /** What the API said, or null before it has been asked. */
  public readonly health = input<Health | null>(null);

  /** True while it is being asked, which on a sleeping host takes seconds. */
  public readonly busy = input(false);

  /** Pressed. The shell decides what asking means. */
  public readonly check = output<void>();

  /** The word the badge shows, which is Unknown until something answers. */
  protected readonly status = computed(() => this.health()?.status ?? 'Unknown');

  /** A worker that has missed its window is what this panel exists to make visible. */
  protected readonly overdue = computed(
    () => this.health()?.workers.some((worker) => worker.overdue) ?? false,
  );

  /** How long ago, in the largest unit that still reads as a number. */
  protected ago(seconds: number): string {
    if (seconds < 90) {
      return `${seconds}s ago`;
    }

    if (seconds < 5400) {
      return `${Math.round(seconds / 60)} min ago`;
    }

    return `${Math.round(seconds / 3600)} h ago`;
  }

  /** How often it promised to run, in the same units.  */
  protected every(seconds: number): string {
    if (seconds < 90) {
      return `every ${seconds}s`;
    }

    if (seconds < 5400) {
      return `every ${Math.round(seconds / 60)} min`;
    }

    return `every ${Math.round(seconds / 3600)} h`;
  }
}
