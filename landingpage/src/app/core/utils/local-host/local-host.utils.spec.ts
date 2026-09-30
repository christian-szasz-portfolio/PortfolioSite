import { LocalHostUtils } from './local-host.utils';

describe('LocalHostUtils', () => {
  it.each(['localhost', '127.0.0.1', '[::1]'])('takes %s for this machine', (host) => {
    expect(LocalHostUtils.isLocal(host)).toBe(true);
  });

  it('takes the deployed site for a remote host', () => {
    expect(LocalHostUtils.isLocal('christianszasz.dev')).toBe(false);
  });

  // A lookalike must not be taken for this machine
  it('treats a host that only starts like a local one as remote', () => {
    expect(LocalHostUtils.isLocal('localhost.example.com')).toBe(false);
  });

  // During prerendering there is no browser host at all
  it('treats an empty host as remote', () => {
    expect(LocalHostUtils.isLocal('')).toBe(false);
  });
});
