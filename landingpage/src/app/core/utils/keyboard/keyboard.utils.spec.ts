import { KeyboardKey, KeyboardUtils, ZoomAction } from './keyboard.utils';

describe('KeyboardKey', () => {
  const keys: readonly string[] = Object.values(KeyboardKey);

  it('gives each key one spelling, so no member hides behind another', () => {
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('carries no padding or empty member, which would never match a press', () => {
    for (const key of keys) {
      expect(key, `${JSON.stringify(key)} is padded`).toBe(key.trim());
      expect(key.length, 'an empty key matches nothing').toBeGreaterThan(0);
    }
  });

  // event.key reports 'Escape', never 'escape', so a lower-cased member is dead code.
  it('capitalises the named keys the way the DOM reports them', () => {
    const named = keys.filter((key) => key.length > 1);

    expect(named.length).toBeGreaterThan(0);
    for (const key of named) {
      expect(key[0], `${key} would never match event.key`).toBe(key[0]?.toUpperCase());
    }
  });
});

describe('KeyboardUtils', () => {
  it('maps each zoom shortcut, in its shifted form too', () => {
    expect(KeyboardUtils.zoomActionOf(KeyboardKey.Plus)).toBe(ZoomAction.In);
    expect(KeyboardUtils.zoomActionOf(KeyboardKey.Equals)).toBe(ZoomAction.In);
    expect(KeyboardUtils.zoomActionOf(KeyboardKey.Minus)).toBe(ZoomAction.Out);
    expect(KeyboardUtils.zoomActionOf(KeyboardKey.Underscore)).toBe(ZoomAction.Out);
    expect(KeyboardUtils.zoomActionOf(KeyboardKey.Zero)).toBe(ZoomAction.Reset);
  });

  it('claims no other key, so a pop-up can let the rest through', () => {
    for (const key of ['a', 'Escape', 'ArrowUp', '1', '']) {
      expect(KeyboardUtils.zoomActionOf(key), key).toBeNull();
    }
  });
});
