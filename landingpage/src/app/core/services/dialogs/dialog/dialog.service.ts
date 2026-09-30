import type { ComponentType } from '@angular/cdk/overlay';
import { ViewportScroller } from '@angular/common';
import { DOCUMENT, EnvironmentInjector, Service, inject } from '@angular/core';
import type { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { EMPTY, Observable, defer, filter, from, map, shareReplay, tap } from 'rxjs';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

/** Set while any pop-up is open, for the rules that must change while one is */
const MODAL_CLASS = 'has-modal';

/**
 * Opens a pop-up and marks the document, so the native pointer can be handed back.
 *
 * Material's dialog, and the CDK overlay beneath it, arrive with the first pop-up rather than with
 * the page: no page renders one, and together they are some 80 kB every visitor would otherwise
 * download first. Only types are imported statically, which keeps the module out of the initial
 * bundle. The viewers import it too, so once one has loaded, the fetch here is already answered.
 */
@Service()
export class DialogService {
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly environment = inject(BrowserEnvironment);
  private readonly router = inject(Router);
  private readonly scroller = inject(ViewportScroller);

  /** Fetched on the first pop-up, and shared by every one after it */
  private readonly dialog: Observable<MatDialog> = defer(() =>
    from(import('@angular/material/dialog')),
  ).pipe(
    map((module) => this.injector.get(module.MatDialog)),
    shareReplay(1),
  );

  public open<T>(component: ComponentType<T>, config: MatDialogConfig): Observable<void> {
    // There is no pop-up on the server, so nothing to fetch there either
    if (!this.environment.isBrowser) {
      return EMPTY;
    }

    return this.dialog.pipe(
      tap((dialog) => this.show(dialog, component, config)),
      map(() => undefined),
    );
  }

  /** Where the router meant the new page to be: its fragment's section, or the top */
  private scrollAsRouted(): void {
    const fragment = this.router.parseUrl(this.router.url).fragment;

    if (fragment === null) {
      this.scroller.scrollToPosition([0, 0]);
    } else {
      this.scroller.scrollToAnchor(fragment);
    }
  }

  private show<T>(dialog: MatDialog, component: ComponentType<T>, config: MatDialogConfig): void {
    const root = this.document.documentElement;
    root.classList.add(MODAL_CLASS);

    const reference = dialog.open(component, config);

    let navigated = false;
    const navigation = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => (navigated = true));

    reference.afterClosed().subscribe(() => {
      navigation.unsubscribe();

      // Another pop-up may still be open, so the mark is only dropped last.
      if (dialog.openDialogs.length === 0) {
        root.classList.remove(MODAL_CLASS);
      }

      // Closing restores the scroll the page had when the pop-up opened. After a link in it,
      // that is the old page's, and it can land after the router's own scroll.
      if (navigated) {
        this.scrollAsRouted();
      }
    });
  }
}
