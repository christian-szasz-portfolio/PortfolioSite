import { specCoverage } from '@christian-szasz-portfolio/common-web/tools/spec-coverage.mjs';

/** Exempt files, with the reason: units with no behaviour of their own to assert */
const EXEMPT: readonly string[] = [];

describe('spec coverage', () => {
  const { testable, missing } = specCoverage({ exempt: EXEMPT });

  it('finds something to check, rather than passing on an empty walk', () => {
    expect(testable).toBeGreaterThan(20);
  });

  it('gives every component, service, directive, pipe and util a sibling spec', () => {
    expect(missing, `no sibling spec for:\n  ${missing.join('\n  ')}`).toEqual([]);
  });
});
