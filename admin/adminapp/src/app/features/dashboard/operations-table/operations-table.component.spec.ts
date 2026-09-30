import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageOperation } from '../../../data';
import { OperationsTableComponent } from './operations-table.component';

@Component({
  imports: [OperationsTableComponent],
  template: `<adm-operations-table [operations]="operations()" />`,
})
class Host {
  public readonly operations = signal<readonly UsageOperation[]>([
    { name: 'section', label: 'Section reached', count: 40 },
    { name: 'route', label: 'Page opened', count: 12 },
  ]);
}

describe('OperationsTableComponent', () => {
  let fixture: ComponentFixture<Host>;

  function cells(): string[] {
    return [...fixture.nativeElement.querySelectorAll('tbody td')].map((cell) =>
      (cell as HTMLElement).textContent?.trim(),
    );
  }

  function swatches(): HTMLElement[] {
    return [...fixture.nativeElement.querySelectorAll('.swatch')];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('gives every operation its label and its count', () => {
    expect(cells()).toEqual(['Section reached', '40', 'Page opened', '12']);
  });

  it('keeps the order it was given, which is busiest first', () => {
    const first = fixture.nativeElement.querySelector('tbody td') as HTMLElement;

    expect(first.textContent?.trim()).toBe('Section reached');
  });

  // The swatch is what ties a row to its segment in the chart, so a reader can move between them.
  it('marks each row with the colour that operation carries in the chart', () => {
    const marks = swatches();

    expect(marks).toHaveLength(2);
    expect(marks[0]?.style.background).not.toBe('');
    expect(marks[0]?.style.background).not.toBe(marks[1]?.style.background);
  });

  // A colour follows the operation, not its rank, so overtaking must not repaint the table.
  it('keeps a colour with its operation when the counts change places', () => {
    const before = swatches().map((mark) => mark.style.background);

    fixture.componentInstance.operations.set([
      { name: 'route', label: 'Page opened', count: 90 },
      { name: 'section', label: 'Section reached', count: 40 },
    ]);
    fixture.detectChanges();

    expect(swatches().map((mark) => mark.style.background)).toEqual([...before].reverse());
  });
});
