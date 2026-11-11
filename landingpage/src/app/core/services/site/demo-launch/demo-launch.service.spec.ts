import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DemoLaunchService } from './demo-launch.service';
import { DemoLaunchPhase } from './demo-launch.types';

const DEMO = 'https://demo.example/some/page';

describe('DemoLaunchService', () => {
  let assign: ReturnType<typeof vi.fn>;
  let answer: () => Promise<Response>;
  let asked: string[];
  let inits: (RequestInit | undefined)[];
  let original: typeof fetch;

  const awake = (): Promise<Response> => Promise.resolve(new Response('{"status":"alive"}'));
  const asleep = (): Promise<Response> => Promise.reject(new TypeError('Failed to fetch'));

  const serviceOn = (hostname: string, platform = 'browser'): DemoLaunchService => {
    TestBed.configureTestingModule({
      providers: [
        DemoLaunchService,
        { provide: DOCUMENT, useValue: { location: { hostname, assign } } },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });
    return TestBed.inject(DemoLaunchService);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    assign = vi.fn();
    answer = awake;
    asked = [];
    inits = [];
    original = globalThis.fetch;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      asked.push(url);
      inits.push(init);
      return answer();
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = original;
    vi.useRealTimers();
  });

  it('opens a demo that is already awake without ever showing a notice', async () => {
    const service = serviceOn('christianszasz.dev');

    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(100);

    expect(assign).toHaveBeenCalledExactlyOnceWith(DEMO);
    expect(asked).toEqual(['https://demo.example/health']);
    await vi.advanceTimersByTimeAsync(5000);
    expect(service.launch()).toBeNull();
  });

  it('keeps asking while the demo sleeps, and says how the start is going', async () => {
    answer = asleep;
    const service = serviceOn('christianszasz.dev');

    service.open(DEMO, 'Stack86');
    expect(service.launch()).toBeNull();

    await vi.advanceTimersByTimeAsync(700);
    expect(service.launch()).toMatchObject({ title: 'Stack86', url: DEMO, phase: DemoLaunchPhase.Waking });

    await vi.advanceTimersByTimeAsync(20_000);
    expect(service.launch()?.phase).toBe(DemoLaunchPhase.Slow);

    await vi.advanceTimersByTimeAsync(55_000);
    expect(service.launch()?.phase).toBe(DemoLaunchPhase.Stalled);
    expect(assign).not.toHaveBeenCalled();
    expect(asked.length).toBeGreaterThan(10);
  });

  it('opens the demo the moment it answers, and clears the notice first', async () => {
    answer = asleep;
    const service = serviceOn('christianszasz.dev');
    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(3000);

    answer = awake;
    await vi.advanceTimersByTimeAsync(2000);

    expect(assign).toHaveBeenCalledExactlyOnceWith(DEMO);
    expect(service.launch()).toBeNull();
  });

  it('asks again when the demo answers with a server error', async () => {
    answer = () => Promise.resolve(new Response('', { status: 503 }));
    const service = serviceOn('christianszasz.dev');
    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(4000);
    expect(assign).not.toHaveBeenCalled();

    answer = awake;
    await vi.advanceTimersByTimeAsync(2000);

    expect(assign).toHaveBeenCalledExactlyOnceWith(DEMO);
  });

  it('stops asking, and goes nowhere, once cancelled', async () => {
    answer = asleep;
    const service = serviceOn('christianszasz.dev');
    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(3000);

    service.cancel();
    const askedBefore = asked.length;
    answer = awake;
    await vi.advanceTimersByTimeAsync(10_000);

    expect(service.launch()).toBeNull();
    expect(asked).toHaveLength(askedBefore);
    expect(assign).not.toHaveBeenCalled();
  });

  it('opens the demo at once, answered or not, when asked to', async () => {
    answer = asleep;
    const service = serviceOn('christianszasz.dev');
    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(1000);

    service.openNow();

    expect(assign).toHaveBeenCalledExactlyOnceWith(DEMO);
    expect(service.launch()).toBeNull();
  });

  it('gives up asking after five minutes, and leaves the demo to be opened by hand', async () => {
    answer = asleep;
    const service = serviceOn('christianszasz.dev');
    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(301_000);
    const askedAtTheEnd = asked.length;

    await vi.advanceTimersByTimeAsync(20_000);

    expect(asked).toHaveLength(askedAtTheEnd);
    expect(service.launch()?.phase).toBe(DemoLaunchPhase.Stalled);
  });

  it('never aborts a request, so a long wait or a cancel cannot raise an AbortError', async () => {
    const abort = vi.spyOn(AbortController.prototype, 'abort');
    answer = () => new Promise<Response>(() => undefined);
    const service = serviceOn('christianszasz.dev');

    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(120_000);
    service.cancel();

    expect(abort).not.toHaveBeenCalled();
    expect(inits.every((init) => init?.signal === undefined)).toBe(true);
    abort.mockRestore();
  });

  it('keeps one request waiting on a demo that is slow to answer, rather than piling on more', async () => {
    answer = () => new Promise<Response>(() => undefined);
    const service = serviceOn('christianszasz.dev');

    service.open(DEMO, 'Stack86');
    await vi.advanceTimersByTimeAsync(60_000);

    expect(asked).toHaveLength(1);
    expect(service.launch()?.phase).toBe(DemoLaunchPhase.Slow);
  });

  it('opens a demo at once from a page served on this machine, asking nothing', () => {
    serviceOn('localhost').open('http://localhost:8086/', 'Stack86');

    expect(assign).toHaveBeenCalledExactlyOnceWith('http://localhost:8086/');
    expect(asked).toEqual([]);
  });

  it('opens a demo at once while prerendering', () => {
    serviceOn('christianszasz.dev', 'server').open(DEMO, 'Stack86');

    expect(assign).toHaveBeenCalledExactlyOnceWith(DEMO);
    expect(asked).toEqual([]);
  });
});
