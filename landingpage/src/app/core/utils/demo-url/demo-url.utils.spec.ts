import { DemoUrlUtils } from './demo-url.utils';

const taskly = 'https://taskly.christianszasz.dev';
const stack86 = 'https://stack86.christianszasz.dev';

describe('DemoUrlUtils', () => {
  it('links the deployed demos from the deployed site', () => {
    expect(DemoUrlUtils.forHost('christianszasz.dev', taskly)).toBe(taskly);
    expect(DemoUrlUtils.forHost('christianszasz.dev', stack86)).toBe(stack86);
  });

  it.each(['localhost', '127.0.0.1', '[::1]'])('links the local demos from a page served on %s', (host) => {
    expect(DemoUrlUtils.forHost(host, taskly)).toBe('http://localhost:1998');
    expect(DemoUrlUtils.forHost(host, stack86)).toBe('http://localhost:8086');
  });

  it('keeps the path when it swaps the origin', () => {
    expect(DemoUrlUtils.forHost('localhost', `${taskly}/tasks`)).toBe('http://localhost:1998/tasks');
  });

  it('leaves an address it has no local stand-in for alone', () => {
    expect(DemoUrlUtils.forHost('localhost', 'https://example.com/demo')).toBe('https://example.com/demo');
    expect(DemoUrlUtils.forHost('localhost', 'not a url')).toBe('not a url');
  });
});
