import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { Pillar } from '../../../data';
import { PillarCardComponent } from './pillar-card.component';

@Component({
  imports: [PillarCardComponent],
  template: `<ul>
    <lpg-pillar-card [pillar]="pillar" />
  </ul>`,
})
class Host {
  public readonly pillar: Pillar = {
    index: '01',
    title: 'The arrow points one way',
    text: 'A domain that depends on nothing can be reasoned about on its own.',
  };
}

describe('PillarCardComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders the index, title and text', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.pillar__index')?.textContent?.trim()).toBe('01');
    expect(element.querySelector('.pillar__title')?.textContent?.trim()).toBe(
      'The arrow points one way',
    );
    expect(element.querySelector('.pillar__text')?.textContent?.trim()).toContain('reasoned about');
  });

  it('hides the decorative numeral from assistive tech', () => {
    const index = fixture.nativeElement.querySelector('.pillar__index') as HTMLElement;

    expect(index.getAttribute('aria-hidden')).toBe('true');
  });

  it('is a list item, so the three read as a set', () => {
    expect(fixture.nativeElement.querySelector('li.pillar')).not.toBeNull();
  });
});
