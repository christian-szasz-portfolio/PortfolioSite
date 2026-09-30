import { DOCUMENT, Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

const WORD_DELAY_MS = 42;

/** Splits a heading into per-word spans for the mask reveal */
@Directive({
  selector: '[lpgSplitText]',
})
export class SplitTextDirective {
  /** The heading's text when it can change; empty takes the heading as first rendered */
  public readonly lpgSplitText = input('');

  /** Extra delay before this heading's first word, in milliseconds */
  public readonly splitDelay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly environment = inject(BrowserEnvironment);

  public constructor() {
    // Splitting detaches the text Angular binds, so a new heading is split again from the input
    afterRenderEffect(() => {
      const bound = this.lpgSplitText();
      const delay = this.splitDelay();

      if (!this.environment.animationsEnabled()) {
        return;
      }
      this.split(bound === '' ? (this.host.nativeElement.textContent?.trim() ?? '') : bound, delay);
    });
  }

  private split(text: string, offset: number): void {
    if (text === '') {
      return;
    }

    const element = this.host.nativeElement;
    const words = text.split(/\s+/);
    const fragment = this.document.createDocumentFragment();

    words.forEach((word, index) => {
      const outer = this.document.createElement('span');
      outer.className = 'split__word';

      const inner = this.document.createElement('span');
      inner.className = 'split__inner';
      inner.textContent = word;
      inner.style.setProperty('--delay', `${offset + index * WORD_DELAY_MS}ms`);

      outer.append(inner);
      fragment.append(outer);

      if (index < words.length - 1) {
        fragment.append(this.document.createTextNode(' '));
      }
    });

    const holder = this.document.createElement('span');
    holder.setAttribute('aria-hidden', 'true');
    holder.append(fragment);

    element.setAttribute('aria-label', text);
    element.textContent = '';
    element.append(holder);
    element.classList.add('split');
  }
}
