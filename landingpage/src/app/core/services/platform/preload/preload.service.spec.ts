import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';

import { preloadFlag, PreloadService } from './preload.service';

describe('PreloadService', () => {
  let service: PreloadService;

  /** Records whether the route was actually asked for */
  const loader = () => {
    let called = false;
    const load = () => {
      called = true;
      return of('loaded');
    };
    return { load, wasCalled: () => called };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreloadService);
  });

  it('fetches a route that asked to be fetched', async () => {
    const route: Route = { path: 'work/:slug', data: { [preloadFlag]: true } };
    const { load, wasCalled } = loader();

    const result = await firstValueFrom(service.preload(route, load));

    expect(wasCalled()).toBe(true);
    expect(result).toBe('loaded');
  });

  it('leaves a route that did not ask, rather than pulling the whole site down', async () => {
    const route: Route = { path: 'cookies' };
    const { load, wasCalled } = loader();

    const result = await firstValueFrom(service.preload(route, load));

    expect(wasCalled()).toBe(false);
    expect(result).toBeNull();
  });

  it('takes only the flag set true, not merely present', async () => {
    const route: Route = { path: 'cookies', data: { [preloadFlag]: 'later' } };
    const { load, wasCalled } = loader();

    await firstValueFrom(service.preload(route, load));

    expect(wasCalled()).toBe(false);
  });

  it('handles a route carrying no data at all', async () => {
    const route: Route = { path: '**' };
    const { load } = loader();

    await expect(firstValueFrom(service.preload(route, load))).resolves.toBeNull();
  });
});
