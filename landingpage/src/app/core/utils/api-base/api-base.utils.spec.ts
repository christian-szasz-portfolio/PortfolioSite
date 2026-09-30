import { ApiBaseUtils } from './api-base.utils';

const production = 'https://api.christianszasz.dev';

describe('ApiBaseUtils', () => {
  it.each(['localhost', '127.0.0.1', '[::1]'])(
    'keeps a page served on %s on the local proxy',
    (host) => {
      expect(ApiBaseUtils.forHost(host, production)).toBe('/api');
    },
  );

  it('sends the deployed site to the API at its own origin', () => {
    expect(ApiBaseUtils.forHost('christianszasz.dev', production)).toBe(`${production}/api`);
  });

  // A lookalike must not be taken for this machine
  it('treats a host that only starts like a local one as remote', () => {
    expect(ApiBaseUtils.forHost('localhost.example.com', production)).toBe(`${production}/api`);
  });
});
