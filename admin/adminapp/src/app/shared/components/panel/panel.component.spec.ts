import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelComponent } from './panel.component';

@Component({
  imports: [PanelComponent],
  template: `
    <adm-panel heading="Views a day" note="One a browser a day"><p class="inside">4</p></adm-panel>
    <adm-panel heading="Days"><p class="bare">nothing to explain</p></adm-panel>
  `,
})
class Host {}

describe('PanelComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('shows the heading and the line that says how to read it', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.panel__title')?.textContent?.trim()).toBe('Views a day');
    expect(element.querySelector('.panel__note')?.textContent?.trim()).toBe('One a browser a day');
  });

  // A heading of its own is a heading a screen reader lands on, so the page has an outline.
  it('makes the heading a heading rather than a styled line', () => {
    expect(fixture.nativeElement.querySelector('h2.panel__title')).not.toBeNull();
  });

  it('leaves the note out entirely when there is nothing to say', () => {
    const bare = fixture.nativeElement.querySelectorAll('adm-panel')[1] as HTMLElement;

    expect(bare.querySelector('.panel__note')).toBeNull();
  });

  it('shows what it was given, whatever that is', () => {
    expect(fixture.nativeElement.querySelector('.inside')?.textContent).toBe('4');
    expect(fixture.nativeElement.querySelector('.bare')).not.toBeNull();
  });
});
