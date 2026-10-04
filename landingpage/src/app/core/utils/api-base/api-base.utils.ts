import { LocalHostUtils } from '../local-host/local-host.utils';

/**
 * Where the site sends its API requests. A page running on this machine talks to the local API
 * through the dev servers' `/api` proxy; only the deployed site calls the API at its own origin,
 * so a local build never reaches production.
 */
export class ApiBaseUtils {
  /** The base the API calls start from, for a page served on `hostname` */
  public static forHost(hostname: string, apiOrigin: string): string {
    return LocalHostUtils.isLocal(hostname) ? '/api' : `${apiOrigin}/api`;
  }

  /** The address a failed API is asked whether it is back, or none where nothing may reach production */
  public static probeFor(hostname: string, apiOrigin: string): string | null {
    return LocalHostUtils.isLocal(hostname) ? null : `${apiOrigin}/health/ready`;
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
