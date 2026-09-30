/** Inert IntersectionObserver stand-in, since jsdom has none and three directives build one */
class InertIntersectionObserver implements IntersectionObserver {
  // Nothing is ever reported: a spec that needs a report installs its own.
  public readonly root: Element | Document | null = null;
  public readonly rootMargin: string = '0px';
  public readonly thresholds: readonly number[] = [0];
  public readonly scrollMargin: string = '0px';

  public observe(): void {
    /** Intentionally inert */
  }

  public unobserve(): void {
    /** Intentionally inert */
  }

  public disconnect(): void {
    /** Intentionally inert */
  }

  public takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = InertIntersectionObserver;
}

/** jsdom has no ResizeObserver either, and the carousel measures with one. */
class InertResizeObserver implements ResizeObserver {
  public observe(): void {
    /** Intentionally inert */
  }

  public unobserve(): void {
    /** Intentionally inert */
  }

  public disconnect(): void {
    /** Intentionally inert */
  }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = InertResizeObserver;
}

/** play/pause stand-ins raising the events jsdom never does, so component state still follows */
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement): Promise<void> {
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  };

  HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement): void {
    this.dispatchEvent(new Event('pause'));
  };
}

/** Object URL stand-in: the specs assert what was handed over, not the URL */
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = (): string => 'blob:stub';
  URL.revokeObjectURL = (): void => {
    /** Intentionally inert */
  };
}
