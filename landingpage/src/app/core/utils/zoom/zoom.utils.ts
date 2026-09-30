import { KeyboardUtils, ZoomAction } from '../keyboard/keyboard.utils';

/** What a zoomable surface offers the shared wheel and key handling */
export interface Zoomable {
  /** One step in or out; the wheel passes its event, so a viewer can zoom around the pointer */
  nudge(direction: number, event?: WheelEvent): void;

  /** What the 0 key means here: true size in a document, a fit in a drawing */
  reset(): void;
}

/**
 * The wheel and keyboard conventions every zoomable pop-up shares: Ctrl and a wheel zooms while a
 * plain wheel keeps panning, and the browser's own zoom shortcuts are taken so they cannot scale
 * the site under the pop-up.
 */
export class ZoomInput {
  public constructor(private readonly target: Zoomable) {}

  public onWheel(event: WheelEvent): void {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    this.target.nudge(-Math.sign(event.deltaY), event);
  }

  public onKey(event: KeyboardEvent): void {
    const action = KeyboardUtils.zoomActionOf(event.key);
    if (action === null) {
      return;
    }

    if (action === ZoomAction.Reset) {
      this.target.reset();
    } else {
      this.target.nudge(action === ZoomAction.In ? 1 : -1);
    }

    event.preventDefault();
  }
}
