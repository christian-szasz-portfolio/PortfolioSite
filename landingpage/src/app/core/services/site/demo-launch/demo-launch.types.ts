/** How far a demo's start has got, which decides what the notice tells the visitor */
export enum DemoLaunchPhase {
  Waking = 'waking',
  Slow = 'slow',
  Stalled = 'stalled',
}

/** A demo that is starting, as far as the notice needs to show it */
export interface DemoLaunch {
  readonly title: string;
  readonly url: string;
  readonly phase: DemoLaunchPhase;
  /** Whole seconds since the click */
  readonly seconds: number;
}
