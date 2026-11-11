import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { DemoLaunchService } from '../../../../core/services/site/demo-launch/demo-launch.service';
import { DemoLaunchPhase } from '../../../../core/services/site/demo-launch/demo-launch.types';

/** Tells a visitor a demo is starting, so a cold start reads as a short wait and not a dead link */
@Component({
  selector: 'lpg-demo-launch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancel()' },
  templateUrl: './demo-launch.component.html',
  styleUrl: './demo-launch.component.scss',
})
export class DemoLaunchComponent {
  private readonly service = inject(DemoLaunchService);

  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly phases = DemoLaunchPhase;

  protected readonly launch = this.service.launch;

  /** Named in the component, because a translator needs the whole sentence */
  protected heading(title: string): string {
    return $localize`:@@demoLaunch.heading:Getting the ${title}:title: demo ready`;
  }

  protected cancel(): void {
    this.service.cancel();
  }

  protected openNow(): void {
    this.service.openNow();
  }
}
