import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatCardComponent } from './stat-card.component';

@Component({
  imports: [StatCardComponent],
  template: `<adm-stat-card [value]="46" label="Views archived" accent="#3987e5" />`,
})
class Host {}

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('shows the number and what it counts', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.card__value')?.textContent?.trim()).toBe('46');
    expect(element.querySelector('.card__label')?.textContent?.trim()).toBe('Views archived');
  });

  // The colour is an edge, not the text: a number in a data colour is a number that some readers
  // cannot read, and one that stops meaning anything when the palette changes.
  it('wears the accent on its edge and leaves the value in ink', () => {
    const card = fixture.nativeElement.querySelector('adm-stat-card') as HTMLElement;
    const value = fixture.nativeElement.querySelector('.card__value') as HTMLElement;

    expect(card.style.borderLeftColor).not.toBe('');
    expect(value.style.color).toBe('');
  });
});
