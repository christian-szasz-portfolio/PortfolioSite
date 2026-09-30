import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { DialogService } from '../dialog/dialog.service';
import { SitemapDialogService } from './sitemap-dialog.service';

describe('SitemapDialogService', () => {
  let opened: unknown[];

  const setUp = () => {
    opened = [];

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DialogService,
          useValue: {
            open: (c: unknown, o: unknown) => {
              opened.push([c, o]);
              return of(undefined);
            },
          },
        },
      ],
    });

    return TestBed.inject(SitemapDialogService);
  };

  it('opens the sitemap in the pop-up', async () => {
    const service = setUp();

    await firstValueFrom(service.open());

    expect(opened.length).toBe(1);
  });

  it('ties the pop-up to its own title, not the CV one', async () => {
    const service = setUp();

    await firstValueFrom(service.open());

    const [, options] = opened[0] as [unknown, { ariaLabelledBy: string }];
    expect(options.ariaLabelledBy).toBe('sitemap-modal-title');
  });

  it('fetches the pop-up only when it is asked for, not on every page', async () => {
    const service = setUp();

    // Cold: building the stream must not open anything on its own
    service.open();
    expect(opened.length).toBe(0);

    await firstValueFrom(service.open());

    expect(opened.length).toBe(1);
  });
});
