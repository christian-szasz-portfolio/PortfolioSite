import { DOCUMENT, Service, computed, inject, signal } from '@angular/core';
import { ScrollService } from '@christian-szasz-portfolio/common-web';

/** Past the line by this much, so a section landed exactly on it counts as reached */
const LINE_TOLERANCE = 2;

interface Spied {
  readonly id: string;
  readonly element: HTMLElement;
}

/** Which section is being read: the one under the line an anchor link scrolls a section to */
@Service()
export class ActiveSectionService {
  private readonly document = inject(DOCUMENT);
  private readonly scroll = inject(ScrollService);
  private readonly sections = signal<readonly Spied[]>([]);

  /** Recomputed each scrolled frame, so it measures where the sections are now */
  public readonly active = computed<string | null>(() => {
    const { y, viewport, document } = this.scroll.state();
    const sections = [...this.sections()].sort((a, b) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );

    if (sections.length === 0 || viewport === 0) {
      return null;
    }

    // At the very bottom a short last section can never reach the line, so the last one showing wins
    if (y > 0 && y + viewport >= document - LINE_TOLERANCE) {
      const showing = sections.filter(
        (section) => section.element.getBoundingClientRect().top < viewport,
      );
      return showing.at(-1)?.id ?? null;
    }

    const line = this.readingLine() + LINE_TOLERANCE;
    const reached = sections.find((section) => {
      const box = section.element.getBoundingClientRect();
      return box.top <= line && box.bottom > line;
    });

    return reached?.id ?? null;
  });

  /** Where an anchor puts a section's top: the root's scroll padding, which the browser uses too */
  public readingLine(): number {
    const style = this.document.defaultView?.getComputedStyle(this.document.documentElement);
    return Number.parseFloat(style?.scrollPaddingTop ?? '') || 0;
  }

  public register(id: string, element: HTMLElement): void {
    this.sections.update((current) => [
      ...current.filter((section) => section.id !== id),
      { id, element },
    ]);
  }

  public unregister(id: string): void {
    this.sections.update((current) => current.filter((section) => section.id !== id));
  }
}
