import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProseComponent } from './prose.component';

@Component({
  imports: [ProseComponent],
  template: `
    <lpg-prose>
      <p class="first">A modular monolith.</p>
      <p class="second">The interesting part is the IR.</p>
    </lpg-prose>
  `,
})
class Host {}

describe('ProseComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('projects its content in order, inside the measure', () => {
    const prose = fixture.nativeElement.querySelector('.prose') as HTMLElement;
    const paragraphs = [...prose.querySelectorAll('p')].map((p) => p.className);

    expect(paragraphs).toEqual(['first', 'second']);
  });

  it('adds no markup of its own beyond the one wrapper', () => {
    const prose = fixture.nativeElement.querySelector('.prose') as HTMLElement;

    expect(prose.children.length).toBe(2);
  });
});
