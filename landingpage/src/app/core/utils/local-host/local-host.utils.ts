/** Whether a page is served from this machine, which decides what it may reach */
export class LocalHostUtils {
  /** The hosts a page runs on when it is served from this machine */
  private static readonly localHosts: ReadonlySet<string> = new Set([
    'localhost',
    '127.0.0.1',
    '[::1]',
  ]);

  /** Whether `hostname` is this machine; matched whole, so a lookalike domain is not */
  public static isLocal(hostname: string): boolean {
    return LocalHostUtils.localHosts.has(hostname);
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
