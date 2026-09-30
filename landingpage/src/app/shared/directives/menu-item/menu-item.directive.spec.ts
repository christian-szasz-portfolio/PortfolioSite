import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MenuDirective } from '../menu/menu.directive';
import { MenuItemDirective } from './menu-item.directive';

@Component({
  imports: [MenuDirective, MenuItemDirective],
  template: `
    <div lpgMenu>
      <button class="item" lpgMenuItem>Choice</button>
    </div>
  `,
})
class Host {}

describe('MenuItemDirective', () => {
  it('takes the menuitem role, and hands the menu the element to focus', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.item') as HTMLButtonElement;
    expect(button.getAttribute('role')).toBe('menuitem');

    const item = fixture.debugElement
      .query((node) => node.nativeElement === button)
      .injector.get(MenuItemDirective);

    expect(item.element).toBe(button);

    item.focus();
    expect(document.activeElement).toBe(button);

    fixture.nativeElement.remove();
  });
});
