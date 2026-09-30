import { Service } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/** The flag a route sets on itself to ask to be fetched early */
export const preloadFlag = 'preload';

/** Fetches only the routes that asked, so "See more" is instant without pulling everything */
@Service()
export class PreloadService implements PreloadingStrategy {
  public preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return this.wants(route) ? load() : of(null);
  }

  private wants(route: Route): boolean {
    return route.data?.[preloadFlag] === true;
  }
}
