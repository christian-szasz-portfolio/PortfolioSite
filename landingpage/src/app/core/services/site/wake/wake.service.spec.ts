import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { apiUrl, demoUrls } from '../../../../data/site.data';
import { WakeService } from './wake.service';

describe('WakeService', () => {
  let requested: { url: string; init: RequestInit | undefined }[];
  let original: typeof fetch;

  const serviceOn = (hostname: string, platform = 'browser'): WakeService => {
    TestBed.configureTestingModule({
      providers: [
        WakeService,
        { provide: DOCUMENT, useValue: { location: { hostname } } },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });
    return TestBed.inject(WakeService);
  };

  beforeEach(() => {
    requested = [];
    original = globalThis.fetch;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      requested.push({ url, init });
      return Promise.resolve(new Response('{"status":"alive"}'));
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = original;
  });

  it('wakes the API and every demo at once', () => {
    serviceOn('christianszasz.dev').wakeAll();

    const expected = [apiUrl, ...demoUrls].map((target) => `${new URL(target).origin}/health`);
    expect(requested.map(({ url }) => url)).toEqual(expected);
  });

  it("asks each origin's liveness path once, whatever page of it is named", () => {
    serviceOn('christianszasz.dev').wakeAll(['https://demo.example/some/page', 'https://demo.example/']);

    expect(requested.map(({ url }) => url)).toEqual(['https://demo.example/health']);
  });

  it('sends no cookies and takes nothing from the cache', () => {
    serviceOn('christianszasz.dev').wakeAll(['https://demo.example']);

    expect(requested[0]?.init?.credentials).toBe('omit');
    expect(requested[0]?.init?.cache).toBe('no-store');
  });

  it('leaves production alone when the page is served from this machine', () => {
    serviceOn('localhost').wakeAll();

    expect(requested).toEqual([]);
  });

  it('does nothing while prerendering', () => {
    serviceOn('christianszasz.dev', 'server').wakeAll();

    expect(requested).toEqual([]);
  });

  it('skips an address it cannot parse', () => {
    serviceOn('christianszasz.dev').wakeAll(['not a url', 'https://demo.example']);

    expect(requested.map(({ url }) => url)).toEqual(['https://demo.example/health']);
  });

  it('swallows a backend that does not answer', () => {
    globalThis.fetch = (() => Promise.reject(new TypeError('Failed to fetch'))) as typeof fetch;

    expect(() => serviceOn('christianszasz.dev').wakeAll()).not.toThrow();
  });
});
