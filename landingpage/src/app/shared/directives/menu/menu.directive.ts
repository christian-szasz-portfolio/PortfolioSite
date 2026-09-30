import { DestroyRef, Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';

import { KeyboardKey } from '../../../core/utils/keyboard/keyboard.utils';

// Type-only: a value import here closes a cycle the dev server does not bundle away
import type { MenuItemDirective } from '../menu-item/menu-item.directive';

/** A disclosure menu on the container, which is the delegation root; exported as lpgMenu */
@Directive({
  selector: '[lpgMenu]',
  exportAs: 'lpgMenu',
})
export class MenuDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Registered by the items themselves, in the order they render */
  private readonly items = signal<readonly MenuItemDirective[]>([]);
  private trigger: HTMLElement | null = null;

  public readonly open = signal(false);

  public constructor() {
    afterNextRender(() => {
      const element = this.host.nativeElement;
      const owner = element.ownerDocument;

      const key = (event: KeyboardEvent): void => {
        this.onKey(event);
      };
      const focusOut = (event: FocusEvent): void => {
        this.onFocusOut(event);
      };
      const outside = (event: MouseEvent): void => {
        this.onDocumentClick(event.target);
      };

      element.addEventListener('keydown', key);
      element.addEventListener('focusout', focusOut);
      owner.addEventListener('click', outside);

      this.destroyRef.onDestroy(() => {
        element.removeEventListener('keydown', key);
        element.removeEventListener('focusout', focusOut);
        owner.removeEventListener('click', outside);
      });
    });
  }

  public toggle(): void {
    this.open.update((open) => !open);
  }

  /** Closes and hands focus back, which is what Escape and a choice both owe */
  public close(): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    this.trigger?.focus();
  }

  /** Called by the trigger directive, so focus knows where to return to */
  public register(trigger: HTMLElement): void {
    this.trigger = trigger;
  }

  public add(item: MenuItemDirective): void {
    this.items.update((items) => [...items, item]);
  }

  public remove(item: MenuItemDirective): void {
    this.items.update((items) => items.filter((candidate) => candidate !== item));
  }

  private onKey(event: KeyboardEvent): void {
    if (!this.open()) {
      return;
    }

    if (event.key === KeyboardKey.Escape) {
      this.close();
      // A dialog above listens too, so the first press closes the menu and the next closes that
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (event.key !== KeyboardKey.ArrowDown && event.key !== KeyboardKey.ArrowUp) {
      return;
    }

    const items = this.items();
    if (items.length === 0) {
      return;
    }

    const step = event.key === KeyboardKey.ArrowDown ? 1 : -1;
    const active = this.host.nativeElement.ownerDocument.activeElement;
    const current = items.findIndex((item) => item.element === active);
    const next =
      current === -1
        ? step === 1
          ? 0
          : items.length - 1
        : (current + step + items.length) % items.length;

    items[next]?.focus();
    event.preventDefault();
  }

  /** Tabbing out dismisses it, without dragging focus back in */
  private onFocusOut(event: FocusEvent): void {
    // Closing tears down the focused element, so this fires mid-render; NG0600
    if (!this.open()) {
      return;
    }

    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) {
      return;
    }
    this.open.set(false);
  }

  private onDocumentClick(target: EventTarget | null): void {
    if (!this.open()) {
      return;
    }

    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }
    this.open.set(false);
  }
}
