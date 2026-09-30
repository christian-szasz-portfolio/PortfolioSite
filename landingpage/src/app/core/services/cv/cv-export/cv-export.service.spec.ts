import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { cv } from '../../../../data';
import { CvExportService } from './cv-export.service';

describe('CvExportService', () => {
  let service: CvExportService;
  const cleanUp: (() => void)[] = [];

  /** A sheet standing in for the rendered CV, with a style that reaches it */
  const standUpSheet = (): HTMLElement => {
    const style = document.createElement('style');
    style.textContent = `
      .cv { color: rgb(1, 2, 3); }
      .cv .profile__name { font-weight: 700; }
      .nowhere-near-the-cv { color: red; }
      @media print { .cv { box-shadow: none; } }
    `;
    document.head.append(style);

    const sheet = document.createElement('article');
    sheet.className = 'cv';
    sheet.innerHTML =
      '<h1 class="profile__name">Christian</h1><img src="assets/img/cv-photo.jpg" alt="x">';
    document.body.append(sheet);

    cleanUp.push(() => {
      style.remove();
      sheet.remove();
    });
    return sheet;
  };

  const stubFetch = (answer: () => Response): void => {
    const original = globalThis.fetch;
    globalThis.fetch = (() => Promise.resolve(answer())) as typeof fetch;
    cleanUp.push(() => {
      globalThis.fetch = original;
    });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CvExportService] });
    service = TestBed.inject(CvExportService);
  });

  afterEach(() => {
    while (cleanUp.length > 0) {
      cleanUp.pop()?.();
    }
  });

  it('builds a whole document around the sheet it is given', async () => {
    const sheet = standUpSheet();
    stubFetch(() => new Response(new Uint8Array([1, 2, 3])));

    const files = await firstValueFrom(service.collect(sheet));
    const page = files['CV_Christian_Szasz.html'];

    expect(typeof page).toBe('string');
    expect(String(page)).toContain('<!DOCTYPE html>');
    expect(String(page)).toContain('class="cv"');
    expect(String(page)).toContain('Christian');
    expect(String(page)).toContain(cv.documentTitle);
    // It must point at the copy inside the archive, not the one the site serves
    expect(String(page)).toContain('src="img/photo.jpg"');
    expect(String(page)).not.toContain('assets/img/cv-photo.jpg');
  });

  it('makes the body column the main landmark once the sheet stands alone', async () => {
    const sheet = standUpSheet();
    sheet.insertAdjacentHTML('beforeend', '<div class="cv__main"><p>Work</p></div>');
    stubFetch(() => new Response(new Uint8Array([1])));

    const page = String((await firstValueFrom(service.collect(sheet)))['CV_Christian_Szasz.html']);

    expect(page).toContain('<main class="cv__main"><p>Work</p></main>');
    expect(sheet.querySelector('main')).toBeNull();
  });

  it('leaves the photograph on the page where it was', async () => {
    const sheet = standUpSheet();
    stubFetch(() => new Response(new Uint8Array([1])));

    await firstValueFrom(service.collect(sheet));

    expect(sheet.querySelector('img')?.getAttribute('src')).toBe('assets/img/cv-photo.jpg');
  });

  it('keeps the rules that reach the sheet and drops the ones that do not', async () => {
    const sheet = standUpSheet();
    stubFetch(() => new Response(new Uint8Array([1])));

    const files = await firstValueFrom(service.collect(sheet));
    const styles = String(files['css/cv.css']);

    expect(styles).toContain('.cv');
    expect(styles).toContain('.profile__name');
    // The rest of the site has no business in the CV's own stylesheet
    expect(styles).not.toContain('nowhere-near-the-cv');
  });

  it('leaves no trace of Angular in the exported HTML or CSS', async () => {
    const style = document.createElement('style');
    style.textContent = `
      .cv-line[_ngcontent-ng-c9] { color: rgb(4, 5, 6); }
      lpg-cv-main[_nghost-ng-c9] { display: contents; }
      lpg-cv-main { display: contents; }
    `;
    document.head.append(style);

    const sheet = document.createElement('article');
    sheet.className = 'cv';
    sheet.setAttribute('_ngcontent-ng-c8', '');
    sheet.innerHTML =
      '<lpg-cv-main _ngcontent-ng-c8 _nghost-ng-c9 ngh="0">' +
      '<!--container-->' +
      '<p class="cv-line ng-star-inserted" _ngcontent-ng-c9 lpgreveal="">close to the metal</p>' +
      '<!--bindings={"ng-reflect-ng-if":"true"}-->' +
      '<img src="assets/img/cv-photo.jpg" alt="x" _ngcontent-ng-c9>' +
      '</lpg-cv-main>';
    document.body.append(sheet);
    cleanUp.push(() => {
      style.remove();
      sheet.remove();
    });
    stubFetch(() => new Response(new Uint8Array([1])));

    const files = await firstValueFrom(service.collect(sheet));
    const page = String(files['CV_Christian_Szasz.html']);
    const styles = String(files['css/cv.css']);

    const traces = [
      '_ngcontent',
      '_nghost',
      'ng-c',
      'lpg-',
      'ngh=',
      'ng-star-inserted',
      'ng-reflect',
      'lpgreveal',
    ];
    for (const trace of traces) {
      expect(page, `HTML still contains ${trace}`).not.toContain(trace);
      expect(styles, `CSS still contains ${trace}`).not.toContain(trace);
    }

    // Angular anchors its control flow on comments, so the archive keeps none.
    expect(page, 'HTML still contains a comment node').not.toContain('<!--');

    // The real content and its own (now clean) rule survive the unwrapping.
    expect(page).toContain('close to the metal');
    expect(page).toContain('class="cv-line"');
    expect(styles).toContain('.cv-line');
  });

  it('drops a class attribute left empty once the Angular classes go', async () => {
    const sheet = standUpSheet();
    sheet.insertAdjacentHTML('beforeend', '<span class="ng-star-inserted">bare</span>');
    stubFetch(() => new Response(new Uint8Array([1])));

    const page = String((await firstValueFrom(service.collect(sheet)))['CV_Christian_Szasz.html']);

    expect(page).toContain('<span>bare</span>');
  });

  it('carries the photograph across as bytes', async () => {
    const sheet = standUpSheet();
    stubFetch(() => new Response(new Uint8Array([9, 8, 7])));

    const files = await firstValueFrom(service.collect(sheet));

    expect(files['img/photo.jpg']).toBeInstanceOf(Uint8Array);
  });

  it('fails rather than shipping an archive with no photograph in it', async () => {
    const sheet = standUpSheet();
    stubFetch(() => new Response('gone', { status: 404 }));

    await expect(firstValueFrom(service.collect(sheet))).rejects.toThrow();
  });
});
