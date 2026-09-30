import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionHeaderComponent } from './section-header.component';

@Component({
  imports: [SectionHeaderComponent],
  template: `
    <lpg-section-header eyebrow="The work" heading="Three things" lede="Not code samples." />
  `,
})
class Host {}

describe('SectionHeaderComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders all three parts', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.section__eyebrow')?.textContent?.trim()).toBe('The work');
    expect(element.querySelector('.section__title')?.textContent?.trim()).toBe('Three things');
    expect(element.querySelector('.section__lede')?.textContent?.trim()).toBe('Not code samples.');
  });

  it('uses a level two heading, so the page outline stays intact', () => {
    const heading = fixture.nativeElement.querySelector('.section__title') as HTMLElement;

    expect(heading.tagName).toBe('H2');
  });
});
