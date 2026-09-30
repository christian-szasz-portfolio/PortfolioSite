import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { pillars } from '../../../data';
import { ThinkingSectionComponent } from './thinking-section.component';

describe('ThinkingSectionComponent', () => {
  let fixture: ComponentFixture<ThinkingSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThinkingSectionComponent],
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

    fixture = TestBed.createComponent(ThinkingSectionComponent);
    fixture.detectChanges();
  });

  it('renders one card per opinion', () => {
    expect(fixture.nativeElement.querySelectorAll('.pillar').length).toBe(pillars.length);
  });

  it('keeps the cards inside one list', () => {
    const list = fixture.nativeElement.querySelector('ul.pillars') as HTMLElement;

    expect(list.querySelectorAll('li.pillar').length).toBe(pillars.length);
  });

  it('anchors the section for the navigation', () => {
    expect((fixture.nativeElement.querySelector('section') as HTMLElement).id).toBe('thinking');
  });
});
