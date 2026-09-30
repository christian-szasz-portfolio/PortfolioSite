import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { CurrentPathService } from './current-path.service';

describe('CurrentPathService', () => {
  let service: CurrentPathService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'cookies', children: [] },
          { path: 'work/:slug', children: [] },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    service = TestBed.inject(CurrentPathService);
  });

  it('answers a path before anything has navigated', () => {
    expect(service.path()).toBe('/');
  });

  it('follows the route as it changes', async () => {
    await router.navigate(['/work', 'stack86']);

    expect(service.path()).toBe('/work/stack86');
  });

  it('drops the fragment, which is what callers add for themselves', async () => {
    await router.navigate(['/cookies'], { fragment: 'main' });

    expect(service.path()).toBe('/cookies');
  });

  it('keeps the path when only the fragment moves', async () => {
    await router.navigate(['/work', 'taskly'], { fragment: 'overview' });
    const first = service.path();

    await router.navigate(['/work', 'taskly'], { fragment: 'testing' });

    expect(service.path()).toBe(first);
    expect(service.path()).toBe('/work/taskly');
  });
});
