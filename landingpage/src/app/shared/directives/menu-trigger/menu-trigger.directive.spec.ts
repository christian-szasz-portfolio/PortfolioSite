import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MenuDirective } from '../menu/menu.directive';
import { MenuTriggerDirective } from './menu-trigger.directive';

@Component({
  imports: [MenuDirective, MenuTriggerDirective],
  template: `
    <div lpgMenu #menu="lpgMenu">
      <button class="trigger" lpgMenuTrigger>Open</button>
      <span class="state">{{ menu.open() }}</span>
    </div>
  `,
})
class Host {}

describe('MenuTriggerDirective', () => {
  it('drives the menu, and keeps aria-expanded in step with it', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    const state = (): string =>
      (fixture.nativeElement.querySelector('.state') as HTMLElement).textContent?.trim() ?? '';

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(state()).toBe('false');

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(state()).toBe('true');
  });
});
