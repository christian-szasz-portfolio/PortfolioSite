import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stat } from '../../../../data';
import { StatListComponent } from './stat-list.component';

@Component({
  imports: [StatListComponent],
  template: `<lpg-stat-list [stats]="stats" />`,
})
class Host {
  public readonly stats: readonly Stat[] = [
    { label: 'Writing software since', value: 2021, plain: true },
    { label: 'Tests standing behind them', value: 2700, suffix: '+' },
  ];
}

describe('StatListComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders the final figure straight away, so prerendered HTML is correct', () => {
    const values = [...fixture.nativeElement.querySelectorAll('.stat__value')].map((e: Element) =>
      e.textContent?.trim(),
    );

    // A year is printed plainly; a quantity is grouped.
    expect(values[0]).toBe('2021');
    expect(values[1]).toContain('2,700');
  });

  it('only shows a suffix where one is given', () => {
    const suffixes = fixture.nativeElement.querySelectorAll('.stat__suffix');

    expect(suffixes.length).toBe(1);
    expect(suffixes[0].textContent.trim()).toBe('+');
  });
});
