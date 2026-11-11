/** Tells a click that opens a link in this tab from one the browser must handle itself */
export class PlainClickUtils {
  /** A primary-button click with no modifier key, so nothing asked for a new tab or a download */
  public static isPlain(event: MouseEvent): boolean {
    return (
      event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && !event.defaultPrevented
    );
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
