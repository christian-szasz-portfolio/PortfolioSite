import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

/** The custom property the stylesheet turns into a delay */
const INDEX_PROPERTY = '--reveal-index';

/** Numbers children so they arrive in turn; written by script, so nothing staggers without it */
@Directive({
  selector: '[lpgRevealGroup]',
})
export class RevealGroupDirective {
  /** Where the count starts for a continuing group; a bare attribute maps to the start */
  public readonly lpgRevealGroup = input<number, number | ''>(0, {
    transform: (value: number | ''): number => (value === '' ? 0 : value),
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly environment = inject(BrowserEnvironment);
  private readonly destroyRef = inject(DestroyRef);

  public constructor() {
    afterNextRender(() => {
      if (!this.environment.animationsEnabled()) {
        return;
      }

      this.number();

      // A list built by `@for` can gain children after the first paint.
      const observer = new MutationObserver(() => this.number());
      observer.observe(this.host.nativeElement, { childList: true });
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private number(): void {
    const start = this.lpgRevealGroup();
    const children = this.host.nativeElement.children;

    for (let index = 0; index < children.length; index += 1) {
      const child = children.item(index);
      if (!(child instanceof HTMLElement)) {
        continue;
      }

      child.style.setProperty(INDEX_PROPERTY, String(start + index));
    }
  }
}
