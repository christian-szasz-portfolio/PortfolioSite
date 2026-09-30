/** What the pop-up is given about a failure, already reduced to text. */
export interface ErrorReport {
  /** The one line shown in place of a title while developing */
  readonly message: string;

  /** The stack, or undefined when whatever was thrown carried none */
  readonly stack?: string;

  /** True while developing, where the point is to read the failure rather than survive it */
  readonly detailed: boolean;
}

/** Turns anything a throw can carry into the two strings the pop-up shows. */
export class ErrorReports {
  /** What a thrown value says about itself when it is not an Error. */
  private static readonly UNKNOWN = 'Unknown error';

  public static of(error: unknown, detailed: boolean): ErrorReport {
    if (error instanceof Error) {
      const stack = error.stack;

      return stack === undefined
        ? { message: ErrorReports.described(error), detailed }
        : { message: ErrorReports.described(error), stack, detailed };
    }

    return { message: ErrorReports.stringify(error), detailed };
  }

  /** The name as well as the message, since a bare message rarely says what threw. */
  private static described(error: Error): string {
    return error.message === '' ? error.name : `${error.name}: ${error.message}`;
  }

  private static stringify(error: unknown): string {
    if (typeof error === 'string') {
      return error === '' ? ErrorReports.UNKNOWN : error;
    }

    if (error === null || error === undefined) {
      return ErrorReports.UNKNOWN;
    }

    // A rejected promise often carries a plain object, which says nothing as "[object Object]"
    try {
      return JSON.stringify(error) ?? ErrorReports.UNKNOWN;
    } catch {
      return String(error);
    }
  }
}
