import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';

/** Where this route sends a reader: the home page */
export const unsupportedRedirect = '/';

/** Sends /unsupported home by meta refresh and location.replace, so scripting is optional */
@Component({
  selector: 'lpg-unsupported',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unsupported.component.html',
  styleUrl: './unsupported.component.scss',
})
export class UnsupportedComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly home = unsupportedRedirect;

  public constructor() {
    this.addMetaRefresh();
    afterNextRender(() => {
      const view = this.document.defaultView;
      if (view !== null) {
        view.location.replace(unsupportedRedirect);
      }
    });
  }

  /** Written into the head so the prerendered page redirects with no script running */
  private addMetaRefresh(): void {
    // The prerender DOM has no `head` and returns undefined for a miss
    const head = this.document.querySelector('head') as HTMLHeadElement | null | undefined;
    if (head == null) {
      return;
    }

    const meta = this.document.createElement('meta');
    meta.setAttribute('http-equiv', 'refresh');
    meta.setAttribute('content', `0; url=${unsupportedRedirect}`);
    head.appendChild(meta);
  }
}
