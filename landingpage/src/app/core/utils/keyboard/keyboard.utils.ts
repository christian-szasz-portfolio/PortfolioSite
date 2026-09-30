/** Every key this site listens for, spelled as KeyboardEvent.key reports it */
export enum KeyboardKey {
  /* lpgMenu: dismiss, and walk the items */
  Escape = 'Escape',
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',

  /* The zoom shortcuts, each in its unshifted and shifted form */
  Plus = '+',
  Equals = '=',
  Minus = '-',
  Underscore = '_',
  Zero = '0',
}

/** What a zoom shortcut asks for */
export enum ZoomAction {
  In = 'in',
  Out = 'out',
  Reset = 'reset',
}

/** The zoom shortcuts, shared by every pop-up that zooms */
export class KeyboardUtils {
  /** The action a press asks for, or null when the key means nothing here */
  public static zoomActionOf(key: string): ZoomAction | null {
    if (key === KeyboardKey.Plus || key === KeyboardKey.Equals) {
      return ZoomAction.In;
    }
    if (key === KeyboardKey.Minus || key === KeyboardKey.Underscore) {
      return ZoomAction.Out;
    }
    return key === KeyboardKey.Zero ? ZoomAction.Reset : null;
  }
}
