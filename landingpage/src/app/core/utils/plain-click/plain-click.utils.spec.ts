import { PlainClickUtils } from './plain-click.utils';

const click = (init: MouseEventInit = {}): MouseEvent => new MouseEvent('click', { button: 0, cancelable: true, ...init });

describe('PlainClickUtils', () => {
  it('takes a primary-button click with no modifier as one that opens the link here', () => {
    expect(PlainClickUtils.isPlain(click())).toBe(true);
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])(
    'leaves a click made with %o to the browser',
    (modifier) => {
      expect(PlainClickUtils.isPlain(click(modifier))).toBe(false);
    },
  );

  it('leaves a middle or right click to the browser', () => {
    expect(PlainClickUtils.isPlain(click({ button: 1 }))).toBe(false);
    expect(PlainClickUtils.isPlain(click({ button: 2 }))).toBe(false);
  });

  it('leaves a click something else already handled', () => {
    const event = click();
    event.preventDefault();

    expect(PlainClickUtils.isPlain(event)).toBe(false);
  });
});
