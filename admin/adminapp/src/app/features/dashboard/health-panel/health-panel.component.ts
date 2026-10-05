import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Health, HealthPhase, HealthStatus, HealthTarget, TargetCheck } from '../../../data';
import { PanelComponent } from '../../../shared/components/panel/panel.component';

/** The colour a status badge wears. */
enum Tone {
  Muted = 'muted',
  Good = 'good',
  Warn = 'warn',
  Bad = 'bad',
}

/** Whether each deployed service is answering, and when the API's workers last ran. */
@Component({
  selector: 'adm-health-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelComponent],
  templateUrl: './health-panel.component.html',
  styleUrl: './health-panel.component.scss',
})
export class HealthPanelComponent {
  /** One row per service, in the order to show them. */
  public readonly checks = input<readonly TargetCheck[]>([]);

  /** True while any service is being asked. */
  public readonly busy = input(false);

  /** Pressed. The shell decides what asking means. */
  public readonly check = output<void>();

  protected readonly Phase = HealthPhase;
  protected readonly Status = HealthStatus;
  protected readonly Target = HealthTarget;

  /** The service's name as the row heads it. */
  protected name(target: HealthTarget): string {
    switch (target) {
      case HealthTarget.Api:
        return 'Analytics API';
      case HealthTarget.Taskly:
        return 'Taskly';
      case HealthTarget.Stack86:
        return 'Stack86';
    }
  }

  /** Unknown stays muted: not having asked is not a fault. */
  protected tone(health: Health | null): Tone {
    if (health === null) {
      return Tone.Muted;
    }

    if (health.status === HealthStatus.Unhealthy) {
      return Tone.Bad;
    }

    if (
      health.status === HealthStatus.Degraded ||
      health.workers.some((worker) => worker.overdue)
    ) {
      return Tone.Warn;
    }

    return health.status === HealthStatus.Healthy ? Tone.Good : Tone.Muted;
  }

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

  /** How often it promised to run, in the same units. */
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
