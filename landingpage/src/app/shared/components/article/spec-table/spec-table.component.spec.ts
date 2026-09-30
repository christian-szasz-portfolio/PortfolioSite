import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fact } from '../../../../data';
import { SpecTableComponent } from './spec-table.component';

const ROWS: readonly Fact[] = [
  { key: 'Role', value: 'Sole author' },
  { key: 'Tests', value: '751 passing' },
];

@Component({
  imports: [SpecTableComponent],
  template: `<lpg-spec-table [rows]="rows" caption="Stack86 at a glance" />`,
})
class Host {
  public readonly rows = ROWS;
}

describe('SpecTableComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('gives one row per fact, in order', () => {
    const rows = [...element().querySelectorAll('.specs__row')].map((row) => [
      row.querySelector('.specs__key')?.textContent?.trim(),
      row.querySelector('.specs__value')?.textContent?.trim(),
    ]);

    expect(rows).toEqual([
      ['Role', 'Sole author'],
      ['Tests', '751 passing'],
    ]);
  });

  it('makes the key a row header, so the value is announced with it', () => {
    const key = element().querySelector('.specs__key') as HTMLElement;

    expect(key.tagName).toBe('TH');
    expect(key.getAttribute('scope')).toBe('row');
  });

  it('names the table for anyone listing them, without showing the caption', () => {
    const caption = element().querySelector('caption') as HTMLElement;

    expect(caption.textContent?.trim()).toBe('Stack86 at a glance');
    expect(caption.classList.contains('visually-hidden')).toBe(true);
  });

  it('lets the table scroll inside its own container', () => {
    expect(element().querySelector('.specs')).not.toBeNull();
  });
});
