import { ErrorHandler, Injector, Service, inject, isDevMode } from '@angular/core';

import { ErrorDialogService } from '../../dialogs/error-dialog/error-dialog.service';
import { ErrorReports } from './error-report';

/**
 * Reports anything that reaches the top of the application in a pop-up.
 *
 * Registered with provideBrowserGlobalErrorListeners, so a rejected promise arrives here too.
 */
@Service()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  public handleError(error: unknown): void {
    // The console first, and whatever happens next: it is the only record a reader can send on.
    console.error(error);

    try {
      // Resolved here rather than injected, so a failure at startup is still reported.
      this.injector.get(ErrorDialogService).open(ErrorReports.of(error, isDevMode())).subscribe();
    } catch (failure) {
      // Reporting a failure must not raise one, or the handler calls itself until the tab dies.
      console.error('The error pop-up could not be opened.', failure);
    }
  }
}
