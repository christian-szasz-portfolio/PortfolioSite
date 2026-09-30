import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AnalyticsService } from './core/services/analytics/analytics.service';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AdminBarComponent } from './layout/admin-bar/admin-bar.component';

/** The shell, and the only component that holds the service. */
@Component({
  selector: 'adm-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminBarComponent, DashboardComponent],
  templateUrl: './adm.component.html',
  styleUrl: './adm.component.scss',
})
export class AdmComponent {
  protected readonly analytics = inject(AnalyticsService);

  public constructor() {
    // Reads the archive on disk. Nothing here reaches the network on its own.
    this.analytics.load();
  }

  protected sync(): void {
    this.analytics.sync();
  }

  /** Asked for, never polled: the API may be asleep, and asking is what wakes it. */
  protected checkHealth(): void {
    this.analytics.checkHealth();
  }
}
