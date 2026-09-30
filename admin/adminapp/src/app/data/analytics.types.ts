/** The shapes the admin service answers with, and nothing else. */

/** One operation on one archived day, or totalled across them. */
export interface UsageOperation {
  readonly name: string;
  readonly label: string;
  readonly count: number;
}

/** One archived day, as the service read it back off this machine's disk. */
export interface UsageDay {
  readonly day: string;
  readonly views: number;
  readonly interactions: number;
  readonly rejected: number;
  readonly operations: readonly UsageOperation[];
  readonly archivedAt: string;
}

/** One country's share of the running view total. */
export interface ViewCountry {
  readonly code: string;
  readonly count: number;
}

/** The view counter as it stood when a sync last took it. */
export interface ViewSnapshot {
  readonly day: string;
  readonly takenAt: string;
  readonly total: number;
  readonly countries: readonly ViewCountry[];
}

/** Everything the dashboard draws. */
export interface Overview {
  readonly archiveLocation: string;

  /** Which storage the archive was synced from, in words. */
  readonly source: string;

  /** False when that storage is the local emulator, so the figures are made up. */
  readonly isLive: boolean;

  readonly days: readonly UsageDay[];
  readonly operations: readonly UsageOperation[];
  readonly archivedViews: number;
  readonly archivedInteractions: number;
  readonly views: ViewSnapshot | null;
}

/** What a sync did, so the page can say it rather than just going quiet. */
export interface SyncReport {
  readonly from: string;
  readonly to: string;
  readonly daysArchived: number;
  readonly viewsTotal: number;
  readonly location: string;
}

/** One check the analytics API ran, and what it said. */
export interface HealthCheck {
  readonly name: string;
  readonly status: string;
  readonly note: string | null;
  readonly ms: number;
}

/** One background worker's last sign of life. */
export interface HealthWorker {
  readonly name: string;
  readonly ageSeconds: number;
  readonly periodSeconds: number;
  readonly overdue: boolean;
}

/** How the analytics API is, or why it could not be asked. */
export interface Health {
  readonly reachable: boolean;
  readonly problem: string | null;
  readonly status: string;
  readonly checks: readonly HealthCheck[];
  readonly workers: readonly HealthWorker[];
}
