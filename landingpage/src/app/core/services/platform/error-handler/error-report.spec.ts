import { ErrorReports } from './error-report';

describe('ErrorReports', () => {
  it('names the error as well as its message, since a message alone rarely says what threw', () => {
    const report = ErrorReports.of(new TypeError('x is not a function'), true);

    expect(report.message).toBe('TypeError: x is not a function');
    expect(report.detailed).toBe(true);
  });

  it('keeps the stack when there is one', () => {
    const error = new Error('broke');
    error.stack = 'Error: broke\n    at somewhere';

    expect(ErrorReports.of(error, true).stack).toBe('Error: broke\n    at somewhere');
  });

  it('leaves the stack out rather than inventing one', () => {
    const error = new Error('broke');
    delete (error as { stack?: string }).stack;

    expect(ErrorReports.of(error, true).stack).toBeUndefined();
  });

  it('falls back to the name when the message is empty', () => {
    expect(ErrorReports.of(new RangeError(), true).message).toBe('RangeError');
  });

  it('takes a thrown string as it is', () => {
    expect(ErrorReports.of('just a string', false).message).toBe('just a string');
  });

  it('describes a thrown object, which would otherwise read as [object Object]', () => {
    expect(ErrorReports.of({ status: 500 }, false).message).toBe('{"status":500}');
  });

  it('says something even when nothing was thrown with it', () => {
    expect(ErrorReports.of(undefined, false).message).toBe('Unknown error');
    expect(ErrorReports.of(null, false).message).toBe('Unknown error');
    expect(ErrorReports.of('', false).message).toBe('Unknown error');
  });

  it('survives an object that cannot be stringified', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    expect(ErrorReports.of(circular, false).message).toBe('[object Object]');
  });
});
