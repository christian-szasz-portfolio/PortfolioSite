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

/** The deployed services the health panel asks, as the service names them. */
export enum HealthTarget {
  Api = 'Api',
  Taskly = 'Taskly',
  Stack86 = 'Stack86',
}

/** Every target, in the order the panel shows them. */
export const healthTargets: readonly HealthTarget[] = Object.values(HealthTarget);

/** What a target or one of its checks says about itself. */
export enum HealthStatus {
  Unknown = 'Unknown',
  Healthy = 'Healthy',
  Degraded = 'Degraded',
  Unhealthy = 'Unhealthy',
}

/** One check a target ran, and what it said. */
export interface HealthCheck {
  readonly name: string;
  readonly status: HealthStatus;
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

/** How one target is, or why it could not be asked. */
export interface Health {
  readonly target: HealthTarget;
  readonly reachable: boolean;
  readonly problem: string | null;
  readonly status: HealthStatus;

  /** The round trip, which shows a cold start. */
  readonly ms: number;

  readonly checks: readonly HealthCheck[];
  readonly workers: readonly HealthWorker[];
}

/** Where asking one target has got to. */
export enum HealthPhase {
  Idle = 'Idle',
  Asking = 'Asking',
  Waking = 'Waking',
  Answered = 'Answered',
}

/** One target's row in the panel, and one step of the health stream: how far asking has got. */
export interface TargetCheck {
  readonly target: HealthTarget;
  readonly phase: HealthPhase;
  readonly health: Health | null;
}
