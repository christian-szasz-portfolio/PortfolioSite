import { LocalHostUtils } from '../local-host/local-host.utils';

/**
 * Where a demo link points. The deployed site links the deployed demos; a page served from this
 * machine links the local ones instead, so a local run of the site never sends you to production.
 */
export class DemoUrlUtils {
  /** Each deployed demo's origin, and the local port the portfolio launcher runs it on */
  private static readonly localOrigins: ReadonlyMap<string, string> = new Map([
    ['https://taskly.christianszasz.dev', 'http://localhost:1998'],
    ['https://stack86.christianszasz.dev', 'http://localhost:8086'],
  ]);

  /** The address to link for the demo at `url`, from a page served on `hostname` */
  public static forHost(hostname: string, url: string): string {
    if (!LocalHostUtils.isLocal(hostname) || !URL.canParse(url)) {
      return url;
    }

    const origin = new URL(url).origin;
    const local = DemoUrlUtils.localOrigins.get(origin);
    return local === undefined ? url : `${local}${url.slice(origin.length)}`;
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
