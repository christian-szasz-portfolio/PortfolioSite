import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { ArchiveService } from '../../../../core/services/cv/archive/archive.service';
import { CvExportService } from '../../../../core/services/cv/cv-export/cv-export.service';
import { PdfService } from '../../../../core/services/cv/pdf/pdf.service';
import { KeyboardKey } from '../../../../core/utils/keyboard/keyboard.utils';
import { CvViewerComponent } from './cv-viewer.component';

class DialogRefStub {
  public closed = 0;
  public close(): void {
    this.closed += 1;
  }
}

describe('CvViewerComponent', () => {
  let fixture: ComponentFixture<CvViewerComponent>;
  let dialogRef: DialogRefStub;
  const cleanUp: (() => void)[] = [];

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const level = (): string => host().querySelector('.zoom__level')?.textContent?.trim() ?? '';

  const press = (label: string): void => {
    const button = Array.from(host().querySelectorAll('button')).find(
      (candidate) =>
        candidate.getAttribute('aria-label') === label || candidate.textContent?.trim() === label,
    );
    button?.click();
    fixture.detectChanges();
  };

  /** Neither the renderer nor the collector can do their real work in jsdom */
  const setUp = async (
    options: {
      pdf?: Observable<Blob>;
      files?: Observable<Record<string, Uint8Array | string>>;
    } = {},
  ) => {
    dialogRef = new DialogRefStub();

    await TestBed.configureTestingModule({
      imports: [CvViewerComponent],
      providers: [
        provideRouter([]),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: PdfService, useValue: { render: () => options.pdf ?? of(new Blob(['pdf'])) } },
        {
          provide: CvExportService,
          useValue: { collect: () => options.files ?? of({ 'a.html': '<p>a</p>' }) },
        },
        { provide: ArchiveService, useValue: { pack: () => of(new Blob(['zip'])) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CvViewerComponent);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const watchDownloads = (): string[] => {
    const handed: string[] = [];
    const click = HTMLAnchorElement.prototype.click;

    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement): void {
      handed.push(this.download);
    };
    cleanUp.push(() => {
      HTMLAnchorElement.prototype.click = click;
    });
    return handed;
  };

  const settle = async (done: () => boolean): Promise<void> => {
    for (let attempt = 0; attempt < 50 && !done(); attempt += 1) {
      await new Promise((resume) => setTimeout(resume, 5));
      fixture.detectChanges();
    }
    fixture.detectChanges();
  };

  afterEach(() => {
    while (cleanUp.length > 0) {
      cleanUp.pop()?.();
    }
  });

  it('renders the CV itself rather than embedding a copy of it', async () => {
    await setUp();

    expect(host().querySelector('.cv')).not.toBeNull();
    expect(host().querySelector('.cv__sidebar')).not.toBeNull();
    // The iframe is gone, which is what lets keys reach this component at all
    expect(host().querySelector('iframe')).toBeNull();
  });

  it('offers the sheet at its own address in a new tab', async () => {
    await setUp();
    const link = host().querySelector('.modal__external');

    expect(link?.getAttribute('href')).toBe('/cv');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('zooms in and out a step at a time', async () => {
    await setUp();

    press('Zoom in');
    expect(level()).toBe('115%');

    press('Zoom out');
    press('Zoom out');
    expect(level()).toBe('85%');
  });

  it('will not zoom past either limit', async () => {
    await setUp();

    for (let step = 0; step < 30; step += 1) {
      press('Zoom in');
    }
    expect(level()).toBe('300%');

    for (let step = 0; step < 40; step += 1) {
      press('Zoom out');
    }
    expect(level()).toBe('35%');
  });

  it('zooms from a key pressed anywhere in the pop-up, not only on the viewport', async () => {
    await setUp();
    const button = host().querySelector('.zoom__button');

    button?.dispatchEvent(
      new KeyboardEvent('keydown', { key: KeyboardKey.Plus, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(level()).toBe('115%');
  });

  it('closes the pop-up through the dialog it was opened in', async () => {
    await setUp();
    fixture.componentInstance.close();

    expect(dialogRef.closed).toBe(1);
  });

  describe('the download menu', () => {
    const trigger = (): HTMLButtonElement =>
      host().querySelector('.download__trigger') as HTMLButtonElement;
    const menu = (): HTMLElement | null =>
      host().querySelector('.download__menu') as HTMLElement | null;
    const items = (): HTMLElement[] => Array.from(host().querySelectorAll('[role="menuitem"]'));

    const open = (): void => {
      trigger().click();
      fixture.detectChanges();
    };

    it('stays shut until it is asked for', async () => {
      await setUp();

      expect(menu()).toBeNull();
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
    });

    it('offers the PDF and the source archive', async () => {
      await setUp();
      open();

      expect(items().length).toBe(2);
      expect(items()[0]?.textContent).toContain('As PDF');
      expect(items()[1]?.textContent).toContain('Whole source');
    });

    it('hands over a PDF without going near the print dialog', async () => {
      await setUp();
      const handed = watchDownloads();
      open();

      items()[0]?.click();
      await settle(() => handed.length > 0);

      expect(handed).toEqual(['CV_Christian_Szasz.pdf']);
      expect(menu()).toBeNull();
    });

    it('packs the sheet it is showing and hands that over', async () => {
      await setUp();
      const handed = watchDownloads();
      open();

      items()[1]?.click();
      await settle(() => handed.length > 0);

      expect(handed).toEqual(['cv-source.zip']);
      expect(menu()).toBeNull();
    });

    it('says so rather than failing silently when the render breaks', async () => {
      await setUp({ pdf: throwError(() => new Error('no canvas')) });
      const handed = watchDownloads();
      open();

      items()[0]?.click();
      await settle(() => menu()?.textContent?.includes('Could not be rendered') === true);

      expect(handed).toEqual([]);
      expect(menu()?.textContent).toContain('Could not be rendered');
    });

    it('says so rather than failing silently when the sheet cannot be collected', async () => {
      await setUp({ files: throwError(() => new Error('no photo')) });
      const handed = watchDownloads();
      open();

      items()[1]?.click();
      await settle(() => menu()?.textContent?.includes('Could not be packed') === true);

      // A partial archive would be worse than none
      expect(handed).toEqual([]);
      expect(menu()?.textContent).toContain('Could not be packed');
    });
  });
});
