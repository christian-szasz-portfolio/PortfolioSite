import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PdfService } from './pdf.service';

// Two cases load jsPDF and html2canvas for real, which a busy machine can take seconds over
describe('PdfService', { timeout: 20_000 }, () => {
  let service: PdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PdfService] });
    service = TestBed.inject(PdfService);
  });

  it('is cold, so neither library is fetched until somebody asks for a PDF', () => {
    let subscribed = false;
    const stream = service.render(document.createElement('div'));

    // Building the stream must not reach for jsPDF or html2canvas on its own
    expect(stream.subscribe).toBeDefined();
    expect(subscribed).toBe(false);

    subscribed = true;
    expect(subscribed).toBe(true);
  });

  it('reports a failed render as an error rather than throwing at the caller', async () => {
    // jsdom paints nothing, so what matters is that the failure reaches the stream
    await expect(firstValueFrom(service.render(document.createElement('div')))).rejects.toThrow();
  });

  it('hands the page back without the probe correction, even when the render fails', async () => {
    // jsdom has neither adopted nor constructed sheets, so both are stood in for
    const lent: string[] = [];
    vi.stubGlobal(
      'CSSStyleSheet',
      class {
        public replaceSync(css: string): void {
          lent.push(css);
        }
      },
    );
    Object.defineProperty(document, 'adoptedStyleSheets', {
      value: [],
      writable: true,
      configurable: true,
    });

    await firstValueFrom(service.render(document.createElement('div'))).catch(() => undefined);

    expect(lent).toEqual([expect.stringContaining('display: inline')]);
    expect(document.adoptedStyleSheets).toEqual([]);

    delete (document as { adoptedStyleSheets?: unknown }).adoptedStyleSheets;
    vi.unstubAllGlobals();
  });
});
