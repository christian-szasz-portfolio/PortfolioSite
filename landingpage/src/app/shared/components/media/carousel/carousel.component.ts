import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { ArrowGlyphs, BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

/** A scroll-snap carousel; the track is a real scroll container and the buttons only page it */
@Component({
  selector: 'lpg-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
})
export class CarouselComponent {
  protected readonly glyphs = ArrowGlyphs;

  /** Names the carousel for anyone listing the regions on the page */
  public readonly label = input.required<string>();

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly environment = inject(BrowserEnvironment);
  private readonly destroyRef = inject(DestroyRef);

  private readonly scrollLeft = signal(0);
  private readonly trackWidth = signal(0);
  private readonly contentWidth = signal(0);
  /** Where the last slide snaps to, which the scroll padding can hold short of the very end */
  private readonly lastStop = signal(0);

  protected readonly count = signal(0);
  protected readonly current = signal(0);

  /** Nothing to page through until the content is wider than the track */
  protected readonly overflowing = computed(() => this.contentWidth() > this.trackWidth() + 1);
  protected readonly atStart = computed(() => this.scrollLeft() <= 1);
  protected readonly atEnd = computed(() => this.scrollLeft() >= this.lastStop() - 1);

  protected readonly slides = computed(() => Array.from({ length: this.count() }, (_, i) => i));

  public constructor() {
    afterNextRender(() => {
      this.measure();

      const element = this.track().nativeElement;
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onScroll(): void {
    const element = this.track().nativeElement;

    // Read here too: late slide content changes scrollWidth without resizing the track
    this.scrollLeft.set(element.scrollLeft);
    this.trackWidth.set(element.clientWidth);
    this.contentWidth.set(element.scrollWidth);

    const end = element.scrollWidth - element.clientWidth;
    const slides = this.slideElements();
    const last = slides.at(-1);
    if (last === undefined) {
      this.lastStop.set(end);
      return;
    }

    const padding = Number.parseFloat(getComputedStyle(element).scrollPaddingInlineStart) || 0;
    this.lastStop.set(Math.min(last.offsetLeft - element.offsetLeft - padding, end));

    // The slide whose left edge is nearest the track's is the one being read.
    const left = element.scrollLeft;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - element.offsetLeft - left);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });

    this.current.set(nearest);
  }

  protected page(direction: -1 | 1): void {
    const element = this.track().nativeElement;
    this.scrollBy(element, direction * Math.max(element.clientWidth * 0.9, 240));
  }

  protected goTo(index: number): void {
    const slide = this.slideElements()[index];
    const element = this.track().nativeElement;
    if (slide === undefined) {
      return;
    }

    this.scrollBy(element, slide.offsetLeft - element.offsetLeft - element.scrollLeft);
  }

  private scrollBy(element: HTMLElement, distance: number): void {
    element.scrollBy({
      left: distance,
      behavior: this.environment.animationsEnabled() ? 'smooth' : 'instant',
    });
  }

  private slideElements(): readonly HTMLElement[] {
    return [...this.track().nativeElement.querySelectorAll<HTMLElement>('.carousel-slide')];
  }

  private measure(): void {
    this.count.set(this.slideElements().length);
    this.onScroll();
  }
}
