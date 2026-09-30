import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable } from 'rxjs';

import type { ErrorReport } from './error-report';
import { ErrorDialogService } from '../../dialogs/error-dialog/error-dialog.service';
import { GlobalErrorHandler } from './global-error.handler';

class ErrorDialogStub {
  public reports: ErrorReport[] = [];

  public failWith: Error | undefined;

  public open(report: ErrorReport): Observable<void> {
    if (this.failWith !== undefined) {
      throw this.failWith;
    }

    this.reports.push(report);
    return EMPTY;
  }
}

/** The handler under test and the pop-up it reports to */
interface HandlerTestBed {
  readonly handler: GlobalErrorHandler;
  readonly dialog: ErrorDialogStub;
}

function configure(): HandlerTestBed {
  const dialog = new ErrorDialogStub();

  TestBed.configureTestingModule({
    providers: [{ provide: ErrorDialogService, useValue: dialog }],
  });

  return { handler: TestBed.inject(GlobalErrorHandler), dialog };
}

describe('GlobalErrorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports what was thrown in the pop-up', () => {
    const { handler, dialog } = configure();

    handler.handleError(new Error('broke'));

    expect(dialog.reports.length).toBe(1);
    expect(dialog.reports[0]?.message).toBe('Error: broke');
  });

  it('asks for the detail the tests are built with, which is development', () => {
    const { handler, dialog } = configure();

    handler.handleError(new Error('broke'));

    expect(dialog.reports[0]?.detailed).toBe(true);
  });

  it('writes to the console as well, which is the record a reader can send on', () => {
    const { handler } = configure();
    const thrown = new Error('broke');

    handler.handleError(thrown);

    expect(console.error).toHaveBeenCalledWith(thrown);
  });

  it('swallows a failure in the pop-up rather than handling its own error forever', () => {
    const { handler, dialog } = configure();
    dialog.failWith = new Error('the pop-up is broken too');

    expect(() => handler.handleError(new Error('broke'))).not.toThrow();
  });
});
