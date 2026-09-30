import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipListComponent } from './chip-list.component';

@Component({
  imports: [ChipListComponent],
  template: `<lpg-chip-list [items]="items" label="Stack" />`,
})
class Host {
  public readonly items = ['C#', 'Angular', 'Azure'] as const;
}

describe('ChipListComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders one chip per item, in order', () => {
    const chips = [...fixture.nativeElement.querySelectorAll('.chip__name')].map((c: Element) =>
      c.textContent?.trim(),
    );

    expect(chips).toEqual(['C#', 'Angular', 'Azure']);
  });

  it('names the list for assistive tech', () => {
    const list = fixture.nativeElement.querySelector('.chips') as HTMLElement;

    expect(list.getAttribute('aria-label')).toBe('Stack');
  });
});
