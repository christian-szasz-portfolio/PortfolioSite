import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { CopyButtonComponent } from './copy-button.component';

@Component({
  imports: [CopyButtonComponent],
  template: `<lpg-copy-button [value]="value" label="snippet" />`,
})
class Host {
  public readonly value = 'const x = 1;';
}

describe('CopyButtonComponent', () => {
  let fixture: ComponentFixture<Host>;
  let written: string[];

  const button = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.copy') as HTMLButtonElement;
  const status = (): HTMLElement =>
    fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;

  const press = async () => {
    button().click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setUp = async (clipboard: { writeText: (value: string) => Promise<void> } | undefined) => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
            window: clipboard === undefined ? { navigator: {} } : { navigator: { clipboard } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  };

  beforeEach(() => {
    written = [];
  });

  it('names what it copies, since the glyph alone cannot', async () => {
    await setUp({
      writeText: async (value) => {
        written.push(value);
      },
    });

    expect(button().getAttribute('aria-label')).toBe('Copy the snippet');
    expect(status().textContent?.trim()).toBe('');
  });

  it('writes the value, and announces that it did', async () => {
    await setUp({
      writeText: async (value) => {
        written.push(value);
      },
    });

    await press();

    expect(written).toEqual(['const x = 1;']);
    expect(button().classList.contains('is-copied')).toBe(true);
    expect(status().textContent?.trim()).toBe('The snippet was copied.');
  });

  it('says so when the clipboard refuses, rather than claiming success', async () => {
    await setUp({
      writeText: async () => {
        throw new Error('denied');
      },
    });

    await press();

    expect(button().classList.contains('is-copied')).toBe(false);
    expect(status().textContent?.trim()).toBe('The snippet could not be copied.');
  });

  it('says so where there is no clipboard at all', async () => {
    await setUp(undefined);

    await press();

    expect(status().textContent?.trim()).toBe('The snippet could not be copied.');
  });

  it('settles back to its resting state', async () => {
    await setUp({
      writeText: async (value) => {
        written.push(value);
      },
    });
    await press();

    await new Promise((resolve) => setTimeout(resolve, 2100));
    fixture.detectChanges();

    expect(button().classList.contains('is-copied')).toBe(false);
    expect(status().textContent?.trim()).toBe('');
  });
});
