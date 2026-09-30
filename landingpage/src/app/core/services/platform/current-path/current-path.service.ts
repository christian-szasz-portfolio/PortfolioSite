import { Location } from '@angular/common';
import { Service, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/** This page's address without a fragment, base-href and locale safe, ready for an href */
@Service()
export class CurrentPathService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  public readonly path = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.external(event.urlAfterRedirects)),
    ),
    { initialValue: this.external(this.router.url) },
  );

  private external(url: string): string {
    return this.location.prepareExternalUrl(CurrentPathService.withoutFragment(url));
  }

  private static withoutFragment(url: string): string {
    return url.split('#')[0] ?? '/';
  }
}
