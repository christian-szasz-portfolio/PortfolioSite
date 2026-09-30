import { DOCUMENT, Service, inject } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

/** Hands a blob over as a download, shared by the source archive and the PDF */
@Service()
export class DownloadService {
  private readonly document = inject(DOCUMENT);
  private readonly environment = inject(BrowserEnvironment);

  /** A blob and a synthetic click: the only way to start a download in-page */
  public save(blob: Blob, fileName: string): void {
    if (!this.environment.isBrowser) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    // Revoked on the next turn, so the download has taken the blob by then
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
