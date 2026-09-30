import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyboardKey } from '../../../core/utils/keyboard/keyboard.utils';
import { MenuDirective } from './menu.directive';
import { MenuItemDirective } from '../menu-item/menu-item.directive';
import { MenuTriggerDirective } from '../menu-trigger/menu-trigger.directive';

@Component({
  imports: [MenuDirective, MenuItemDirective, MenuTriggerDirective],
  template: `
    <div class="wrap" lpgMenu #menu="lpgMenu">
      <button class="trigger" lpgMenuTrigger>Open</button>

      @if (menu.open()) {
        <div class="panel" role="menu">
          <button class="one" lpgMenuItem>One</button>
          @if (extra()) {
            <button class="two" lpgMenuItem>Two</button>
          }
        </div>
      }
    </div>
    <button class="outside">Elsewhere</button>
  `,
})
class Host {
  public readonly extra = signal(true);
}

describe('MenuDirective', () => {
  let fixture: ComponentFixture<Host>;
  const cleanUp: (() => void)[] = [];

  const at = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  const need = <T extends HTMLElement>(selector: string): T => {
    const found = at<T>(selector);
    if (found === null) {
      throw new Error(`no ${selector}`);
    }
    return found;
  };

  const open = (): void => {
    need('.trigger').click();
    fixture.detectChanges();
  };

  const send = (key: KeyboardKey, from = '.panel'): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    (at(from) ?? need('.trigger')).dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  const watchAbove = (): (() => number) => {
    let seen = 0;
    const listener = (): void => {
      seen += 1;
    };
    document.addEventListener('keydown', listener);
    cleanUp.push(() => document.removeEventListener('keydown', listener));
    return () => seen;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    while (cleanUp.length > 0) {
      cleanUp.pop()?.();
    }
    fixture.nativeElement.remove();
  });

  it('starts shut, and the trigger says so', () => {
    expect(at('.panel')).toBeNull();
    expect(need('.trigger').getAttribute('aria-expanded')).toBe('false');
    // The directive supplies the semantics, so a template cannot forget them
    expect(need('.trigger').getAttribute('type')).toBe('button');
    expect(need('.trigger').getAttribute('aria-haspopup')).toBe('menu');
  });

  it('opens and closes from the trigger', () => {
    open();
    expect(at('.panel')).not.toBeNull();
    expect(need('.trigger').getAttribute('aria-expanded')).toBe('true');

    need('.trigger').click();
    fixture.detectChanges();
    expect(at('.panel')).toBeNull();
  });

  it('marks its items for assistive tech', () => {
    open();
    expect(need('.one').getAttribute('role')).toBe('menuitem');
  });

  it('walks the items with the arrows, and wraps', () => {
    open();

    send(KeyboardKey.ArrowDown);
    expect(document.activeElement).toBe(need('.one'));

    send(KeyboardKey.ArrowDown);
    expect(document.activeElement).toBe(need('.two'));

    send(KeyboardKey.ArrowDown);
    expect(document.activeElement).toBe(need('.one'));

    send(KeyboardKey.ArrowUp);
    expect(document.activeElement).toBe(need('.two'));
  });

  it('walks only the items that are actually there', () => {
    fixture.componentInstance.extra.set(false);
    fixture.detectChanges();
    open();

    send(KeyboardKey.ArrowDown);
    send(KeyboardKey.ArrowDown);

    // One item registered, so there is nowhere else to land
    expect(document.activeElement).toBe(need('.one'));
  });

  it('closes on Escape and keeps it from anything listening above', () => {
    open();
    const reached = watchAbove();

    send(KeyboardKey.Escape);

    expect(at('.panel')).toBeNull();
    expect(reached()).toBe(0);
    expect(document.activeElement).toBe(need('.trigger'));
  });

  it('lets Escape through once it is shut', () => {
    const reached = watchAbove();
    send(KeyboardKey.Escape, '.trigger');

    expect(reached()).toBe(1);
  });

  it('dismisses on a click landing outside it', () => {
    open();
    need('.outside').click();
    fixture.detectChanges();

    expect(at('.panel')).toBeNull();
  });

  it('stays open for a click on its own contents', () => {
    open();
    need('.one').click();
    fixture.detectChanges();

    expect(at('.panel')).not.toBeNull();
  });
});
