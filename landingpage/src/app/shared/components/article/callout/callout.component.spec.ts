import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalloutTone } from '../../../../data';
import { CalloutComponent } from './callout.component';

@Component({
  imports: [CalloutComponent],
  template: `<lpg-callout [text]="text" [label]="label()" [tone]="tone()" />`,
})
class Host {
  public readonly text = 'The interesting part is the IR.';
  public readonly label = signal('Engineering note');
  public readonly tone = signal<CalloutTone>(CalloutTone.Note);
}

describe('CalloutComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('shows the text under its label', () => {
    expect(element().querySelector('.note__label')?.textContent?.trim()).toBe('Engineering note');
    expect(element().querySelector('.note__text')?.textContent?.trim()).toBe(
      'The interesting part is the IR.',
    );
  });

  it('is an aside, because it sits beside the argument rather than in it', () => {
    expect(element().querySelector('aside.note')).not.toBeNull();
  });

  it('marks the tone, keeping the block class alongside it', () => {
    const aside = element().querySelector(CalloutTone.Aside) as HTMLElement;

    expect([...aside.classList]).toEqual(expect.arrayContaining([CalloutTone.Note, 'note--note']));

    fixture.componentInstance.tone.set(CalloutTone.Warning);
    fixture.detectChanges();

    expect([...aside.classList]).toEqual(
      expect.arrayContaining([CalloutTone.Note, 'note--warning']),
    );
    expect(aside.classList.contains('note--note')).toBe(false);
  });

  it('takes a label of its own', () => {
    fixture.componentInstance.label.set('Unwritten');
    fixture.detectChanges();

    expect(element().querySelector('.note__label')?.textContent?.trim()).toBe('Unwritten');
  });
});
