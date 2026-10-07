import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { contact, ContactRow } from '../../../../data';
import { ContactListComponent } from './contact-list.component';

@Component({
  imports: [ContactListComponent],
  template: `<lpg-contact-list [rows]="rows" />`,
})
class Host {
  public readonly rows: readonly ContactRow[] = [
    { id: 'email', key: 'Email', text: 'someone@example.com', href: 'mailto:someone@example.com' },
    {
      id: 'languages',
      key: 'Languages',
      parts: [
        { code: 'RO', text: 'Romanian native' },
        { code: 'DE', text: 'German, full technical proficiency' },
        { code: 'GB', text: 'English, full technical proficiency' },
      ],
    },
  ];
}

describe('ContactListComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('links a row that has an href', () => {
    const link = fixture.nativeElement.querySelector('.contact__value a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('mailto:someone@example.com');
    expect(link.textContent?.trim()).toBe('someone@example.com');
  });

  it('leaves a row without an href as plain text', () => {
    const values = fixture.nativeElement.querySelectorAll('.contact__value');

    expect(values.length).toBe(2);
    expect(values[1].querySelector('a')).toBeNull();
    expect(values[1].textContent.replace(/\s+/g, ' ').trim()).toBe(
      'Romanian native German, full technical proficiency English, full technical proficiency',
    );
  });
});

@Component({
  imports: [ContactListComponent],
  template: `<lpg-contact-list [rows]="rows" />`,
})
class RealHost {
  public readonly rows = contact;
}

describe('ContactListComponent marks', () => {
  let fixture: ComponentFixture<RealHost>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RealHost] }).compileComponents();
    fixture = TestBed.createComponent(RealHost);
    fixture.detectChanges();
  });

  // The languages line is three pieces so each can carry the flag of its region, which one
  // string could not do.
  it('draws a flag beside each language', () => {
    const parts = [...fixture.nativeElement.querySelectorAll('.contact__part')] as HTMLElement[];

    expect(parts).toHaveLength(3);
    expect(parts.map((part) => part.textContent?.trim())).toEqual([
      'Romanian native',
      'German, full technical proficiency',
      'English, full technical proficiency',
    ]);
    expect(fixture.nativeElement.querySelectorAll('.contact__part common-flag')).toHaveLength(3);
  });

  it('draws a mark beside every row the site actually shows', () => {
    expect(host().querySelectorAll('.contact__icon svg').length).toBe(contact.length);
  });

  it('has a mark registered for every row, so none is added without one', () => {
    const missing = contact
      .filter((row) => ContactListComponent.iconForId(row.id) === null)
      .map((row) => row.id);

    expect(missing, `no mark registered for: ${missing.join(', ')}`).toEqual([]);
  });

  it('gives the brand rows their real logo and the rest an outline', () => {
    expect(host().querySelectorAll('.contact__icon .icon__fill').length).toBe(2);
    expect(host().querySelectorAll('.contact__icon .icon__stroke').length).toBeGreaterThan(0);
  });

  it('keeps the mark out of the accessible name, since the label already says it', () => {
    const svg = host().querySelector('.contact__icon svg') as SVGElement;

    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
