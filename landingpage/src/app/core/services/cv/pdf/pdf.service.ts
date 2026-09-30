import { DOCUMENT, Service, inject } from '@angular/core';
import { Observable, defer, finalize, forkJoin, from, map, switchMap } from 'rxjs';

/** Twice the CSS size, so the sheet is not soft on a high-density screen */
const SCALE = 2;

/**
 * html2canvas finds each font's baseline with a 1px image on a line of text, in a probe it appends
 * to the body. The site's reset makes images blocks, which drops the probe a line and every word 6px.
 */
const INLINE_PROBE = 'body > div > img { display: inline; }';

/** Renders a page to a PDF in the browser, skipping the print dialog at the cost of real text */
@Service()
export class PdfService {
  private readonly document = inject(DOCUMENT);

  /** Assumes one A4 sheet, drawn to fill the page rather than split across pages */
  public render(element: HTMLElement): Observable<Blob> {
    return forkJoin([from(import('jspdf')), from(import('html2canvas'))]).pipe(
      switchMap(([{ jsPDF }, html2canvas]) =>
        this.withInlineProbe(() =>
          from(
            html2canvas.default(element, {
              scale: SCALE,
              // The sheet's own white, not the pop-up's dark surface behind it
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              // html2canvas awaits what this returns, typed void or not
              onclone: (clone) => {
                this.restyle(clone);
                return this.settle(clone);
              },
            }),
          ),
        ).pipe(
          map((canvas) => {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const page = pdf.internal.pageSize;

            pdf.addImage(
              canvas.toDataURL('image/jpeg', 0.95),
              'JPEG',
              0,
              0,
              page.getWidth(),
              page.getHeight(),
              undefined,
              'FAST',
            );

            return pdf.output('blob');
          }),
        ),
      ),
    );
  }

  /**
   * html2canvas writes its clone's styles as fresh style tags: the page's own, and one hiding the
   * pseudo-elements it redraws. The content security policy refuses them all, which leaves the
   * sheet unstyled and 0 by 0. The same text, adopted as a sheet, is not policed.
   */
  private restyle(clone: Document): void {
    const view = clone.defaultView;
    if (view === null || !('adoptedStyleSheets' in clone)) {
      return;
    }

    const refused = Array.from(clone.querySelectorAll('style'), (style) => style.textContent ?? '');

    // Built from the clone's own constructor, or the clone refuses to adopt it
    const sheet = new view.CSSStyleSheet();
    sheet.replaceSync(refused.join('\n'));
    clone.adoptedStyleSheets = [...clone.adoptedStyleSheets, sheet];
  }

  /**
   * html2canvas waits for the clone's fonts before it has laid the clone out, when nothing has asked
   * for one yet, then measures words in the fallback and draws them in the web font. So the clone
   * finishes its stylesheets, lays out once to request its fonts, and waits for them.
   */
  private settle(clone: Document): Promise<void> {
    const loading = Array.from(clone.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .filter((link) => link.sheet === null)
      .map(
        (link) =>
          new Promise<void>((resolve) => {
            link.addEventListener('load', () => resolve(), { once: true });
            link.addEventListener('error', () => resolve(), { once: true });
          }),
      );

    return Promise.all(loading)
      .then(() => {
        clone.body.getBoundingClientRect();
        return clone.fonts.ready;
      })
      .then(() => undefined);
  }

  /** The probe runs in the live page, so the correction is lent to it for the render alone */
  private withInlineProbe<T>(render: () => Observable<T>): Observable<T> {
    return defer(() => {
      // Without adopted sheets the text only sits low, which beats no PDF at all
      if (!('adoptedStyleSheets' in this.document)) {
        return render();
      }

      // Constructed rather than a style tag, which the content security policy would refuse
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(INLINE_PROBE);
      this.document.adoptedStyleSheets = [...this.document.adoptedStyleSheets, sheet];

      return render().pipe(
        finalize(() => {
          this.document.adoptedStyleSheets = this.document.adoptedStyleSheets.filter(
            (adopted) => adopted !== sheet,
          );
        }),
      );
    });
  }
}
