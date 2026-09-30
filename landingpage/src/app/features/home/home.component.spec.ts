import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment, PointerPosition, PointerService, ScrollService, ScrollState, SEO_CONFIG } from '@christian-szasz-portfolio/common-web';

import { projects } from '../../data';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: SEO_CONFIG, useValue: { siteUrl: 'https://example.test', siteName: 'Test' } },
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
        {
          provide: ScrollService,
          useValue: {
            state: signal<ScrollState>({ y: 0, viewport: 800, document: 3200 }),
            progress: signal(0),
          },
        },
        {
          provide: PointerService,
          useValue: { position: signal<PointerPosition>({ x: 0, y: 0, active: false }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('lays the sections out in the order the nav expects', () => {
    const ids = [...fixture.nativeElement.querySelectorAll('section[id]')].map(
      (section: Element) => section.id,
    );

    expect(ids).toEqual(['top', 'work', 'thinking', 'about']);
  });

  it('carries one card per project', () => {
    expect(fixture.nativeElement.querySelectorAll('lpg-project-card').length).toBe(projects.length);
  });

  it('has exactly one first-level heading, which is the hero', () => {
    const headings = fixture.nativeElement.querySelectorAll('h1');

    expect(headings.length).toBe(1);
  });

  it('sets the document metadata itself, during prerendering', () => {
    expect(TestBed.inject(Title).getTitle()).toContain('Christian-Ioan Szasz');
  });
});
