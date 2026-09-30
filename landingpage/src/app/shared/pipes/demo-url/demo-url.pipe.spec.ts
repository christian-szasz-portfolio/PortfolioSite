import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DemoUrlPipe } from './demo-url.pipe';

const taskly = 'https://taskly.christianszasz.dev';

/** The pipe as a page on `platform` builds it */
function pipeOn(platform: 'browser' | 'server'): DemoUrlPipe {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  return TestBed.runInInjectionContext(() => new DemoUrlPipe());
}

describe('DemoUrlPipe', () => {
  // The test page is served on localhost, which is this machine
  it('links the local demo in a browser on this machine', () => {
    expect(pipeOn('browser').transform(taskly)).toBe('http://localhost:1998');
  });

  it('keeps the deployed address in a prerendered page', () => {
    expect(pipeOn('server').transform(taskly)).toBe(taskly);
  });
});
