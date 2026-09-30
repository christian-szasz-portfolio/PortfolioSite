import { ViewportScroller } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router, UrlSerializer } from '@angular/router';
import { Subject, firstValueFrom, isEmpty } from 'rxjs';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { DialogService } from './dialog.service';

@Component({ template: '' })
class Pane {}

describe('DialogService', () => {
  let closed: Subject<void>;
  let openDialogs: unknown[];
  let opens: number;
  let service: DialogService;
  let routerEvents: Subject<unknown>;
  let url: string;
  let scroller: {
    scrollToPosition: ReturnType<typeof vi.fn>;
    scrollToAnchor: ReturnType<typeof vi.fn>;
  };

  const setUp = (isBrowser: boolean) => {
    closed = new Subject<void>();
    openDialogs = [];
    opens = 0;
    routerEvents = new Subject<unknown>();
    url = '/';
    scroller = { scrollToPosition: vi.fn(), scrollToAnchor: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        {
          // The same token the lazily imported module hands over, so the stub is what arrives
          provide: MatDialog,
          useValue: {
            openDialogs,
            open: () => {
              opens += 1;
              openDialogs.push({});
              return { afterClosed: () => closed };
            },
          },
        },
        { provide: BrowserEnvironment, useValue: { isBrowser } },
        {
          provide: Router,
          useFactory: (serializer: UrlSerializer) => ({
            events: routerEvents,
            get url() {
              return url;
            },
            parseUrl: (text: string) => serializer.parse(text),
          }),
          deps: [UrlSerializer],
        },
        { provide: ViewportScroller, useValue: scroller },
      ],
    });

    service = TestBed.inject(DialogService);
  };

  const marked = () => document.documentElement.classList.contains('has-modal');

  afterEach(() => document.documentElement.classList.remove('has-modal'));

  it('opens nothing until a caller subscribes', () => {
    setUp(true);

    service.open(Pane, {});

    expect(opens).toBe(0);
    expect(marked()).toBe(false);
  });

  it('marks the document while a pop-up is open', async () => {
    setUp(true);

    await firstValueFrom(service.open(Pane, {}));

    expect(opens).toBe(1);
    expect(marked()).toBe(true);
  });

  it('drops the mark once the pop-up closes', async () => {
    setUp(true);

    await firstValueFrom(service.open(Pane, {}));
    openDialogs.pop();
    closed.next();

    expect(marked()).toBe(false);
  });

  it('keeps the mark while another pop-up is still open', async () => {
    setUp(true);

    await firstValueFrom(service.open(Pane, {}));
    await firstValueFrom(service.open(Pane, {}));
    openDialogs.pop(); // only one of the two has gone
    closed.next();

    expect(marked()).toBe(true);
  });

  // Closing restores the old page's scroll, and that can land after the router's own
  it('scrolls a page reached from a pop-up to its top once the pop-up has closed', async () => {
    setUp(true);

    await firstValueFrom(service.open(Pane, {}));
    url = '/work/taskly';
    routerEvents.next(new NavigationEnd(1, url, url));
    openDialogs.pop();
    closed.next();

    expect(scroller.scrollToPosition).toHaveBeenCalledWith([0, 0]);
  });

  it('scrolls to the section a fragment names instead', async () => {
    setUp(true);

    await firstValueFrom(service.open(Pane, {}));
    url = '/#work';
    routerEvents.next(new NavigationEnd(1, url, url));
    openDialogs.pop();
    closed.next();

    expect(scroller.scrollToAnchor).toHaveBeenCalledWith('work');
    expect(scroller.scrollToPosition).not.toHaveBeenCalled();
  });

  it('leaves the scroll alone when the pop-up closed without a navigation', async () => {
    setUp(true);

    await firstValueFrom(service.open(Pane, {}));
    openDialogs.pop();
    closed.next();

    expect(scroller.scrollToPosition).not.toHaveBeenCalled();
    expect(scroller.scrollToAnchor).not.toHaveBeenCalled();
  });

  it('opens nothing on the server, where there is no pop-up to open', async () => {
    setUp(false);

    const empty = await firstValueFrom(service.open(Pane, {}).pipe(isEmpty()));

    expect(empty).toBe(true);
    expect(opens).toBe(0);
    expect(marked()).toBe(false);
  });
});
