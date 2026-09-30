import { KeyboardKey } from '../keyboard/keyboard.utils';
import { ZoomInput, Zoomable } from './zoom.utils';

/** Records what the surface was asked to do */
class SurfaceStub implements Zoomable {
  public nudges: number[] = [];
  public resets = 0;
  public events: (WheelEvent | undefined)[] = [];

  public nudge(direction: number, event?: WheelEvent): void {
    this.nudges.push(direction);
    this.events.push(event);
  }

  public reset(): void {
    this.resets += 1;
  }
}

describe('ZoomInput', () => {
  const setUp = () => {
    const surface = new SurfaceStub();
    return { surface, input: new ZoomInput(surface) };
  };

  const wheel = (deltaY: number, ctrlKey: boolean): WheelEvent =>
    new WheelEvent('wheel', { deltaY, ctrlKey, cancelable: true });

  const key = (value: string): KeyboardEvent =>
    new KeyboardEvent('keydown', { key: value, cancelable: true });

  it('zooms on Ctrl and a wheel, handing the event on so a viewer can follow the pointer', () => {
    const { surface, input } = setUp();

    const up = wheel(-120, true);
    input.onWheel(up);

    expect(surface.nudges).toEqual([1]);
    expect(surface.events[0]).toBe(up);
    expect(up.defaultPrevented).toBe(true);

    input.onWheel(wheel(120, true));
    expect(surface.nudges).toEqual([1, -1]);
  });

  it('leaves a plain wheel to pan', () => {
    const { surface, input } = setUp();

    const event = wheel(-120, false);
    input.onWheel(event);

    expect(surface.nudges).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });

  it('takes the zoom shortcuts, and resets on 0', () => {
    const { surface, input } = setUp();

    for (const value of [
      KeyboardKey.Plus,
      KeyboardKey.Equals,
      KeyboardKey.Minus,
      KeyboardKey.Underscore,
    ]) {
      const event = key(value);
      input.onKey(event);
      expect(event.defaultPrevented, value).toBe(true);
    }
    expect(surface.nudges).toEqual([1, 1, -1, -1]);
    expect(surface.events.every((event) => event === undefined)).toBe(true);

    const zero = key(KeyboardKey.Zero);
    input.onKey(zero);
    expect(surface.resets).toBe(1);
    expect(zero.defaultPrevented).toBe(true);
  });

  it('lets every other key through', () => {
    const { surface, input } = setUp();

    const event = key('a');
    input.onKey(event);

    expect(surface.nudges).toEqual([]);
    expect(surface.resets).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
});
