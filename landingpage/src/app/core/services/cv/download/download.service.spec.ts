import { TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { DownloadService } from './download.service';

describe('DownloadService', () => {
  const restore: (() => void)[] = [];

  const watchClicks = (): string[] => {
    const handed: string[] = [];
    const click = HTMLAnchorElement.prototype.click;

    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement): void {
      handed.push(this.download);
    };
    restore.push(() => {
      HTMLAnchorElement.prototype.click = click;
    });
    return handed;
  };

  const serviceFor = (isBrowser: boolean): DownloadService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DownloadService, { provide: BrowserEnvironment, useValue: { isBrowser } }],
    });
    return TestBed.inject(DownloadService);
  };

  afterEach(() => {
    while (restore.length > 0) {
      restore.pop()?.();
    }
  });

  it('hands a blob over under the name it is given', () => {
    const handed = watchClicks();

    serviceFor(true).save(new Blob(['x']), 'cv-source.zip');
    expect(handed).toEqual(['cv-source.zip']);
  });

  it('does nothing off the browser, where there is nobody to hand it to', () => {
    const handed = watchClicks();

    serviceFor(false).save(new Blob(['x']), 'nope.zip');
    expect(handed).toEqual([]);
  });
});
