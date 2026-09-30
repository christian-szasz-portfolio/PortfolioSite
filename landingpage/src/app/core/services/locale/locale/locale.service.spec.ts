import { DOCUMENT, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LocaleService, siteLocales } from './locale.service';

describe('LocaleService', () => {
  const serviceAt = (localeId: string, pathname: string): LocaleService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LocaleService,
        { provide: LOCALE_ID, useValue: localeId },
        { provide: DOCUMENT, useValue: { location: { pathname } } },
      ],
    });
    return TestBed.inject(LocaleService);
  };

  const find = (code: string) => {
    const locale = siteLocales.find((candidate) => candidate.code === code);
    if (locale === undefined) {
      throw new Error(`no locale ${code}`);
    }
    return locale;
  };

  it('publishes the three languages, English from the root', () => {
    expect(siteLocales.map((locale) => locale.code)).toEqual(['en-GB', 'de', 'ro']);
    expect(find('en-GB').subPath).toBe('');
  });

  it('knows which language is being read', () => {
    expect(serviceAt('de', '/de-DE/cv').current.code).toBe('de');
    expect(serviceAt('en-GB', '/cv').current.code).toBe('en-GB');
  });

  it('falls back to English when the locale is one it does not publish', () => {
    expect(serviceAt('fr-FR', '/').current.code).toBe('en-GB');
  });

  it('keeps the reader on the same page when they change language', () => {
    const service = serviceAt('en-GB', '/work/stack86');

    expect(service.urlFor(find('de'))).toBe('/de-DE/work/stack86');
    expect(service.urlFor(find('ro'))).toBe('/ro-RO/work/stack86');
    expect(service.urlFor(find('en-GB'))).toBe('/work/stack86');
  });

  it('moves between language folders without stacking one prefix on another', () => {
    const service = serviceAt('de', '/de-DE/work/taskly');

    expect(service.urlFor(find('ro'))).toBe('/ro-RO/work/taskly');
    // Back to the root build, which is named by nothing at all
    expect(service.urlFor(find('en-GB'))).toBe('/work/taskly');
  });

  it('keeps each home page its folder in every language', () => {
    const fromHome = serviceAt('en-GB', '/');
    expect(fromHome.urlFor(find('de'))).toBe('/de-DE/');
    expect(fromHome.urlFor(find('en-GB'))).toBe('/');

    // Either form of the German home reduces to the same route
    for (const pathname of ['/de-DE', '/de-DE/']) {
      const fromGerman = serviceAt('de', pathname);
      expect(fromGerman.urlFor(find('en-GB'))).toBe('/');
      expect(fromGerman.urlFor(find('ro'))).toBe('/ro-RO/');
    }
  });

  it('gives every address the host can serve as a file, never one it would have to rewrite', () => {
    const service = serviceAt('en-GB', '/cv');

    for (const locale of siteLocales) {
      expect(service.urlFor(locale)).not.toContain('?');
    }
  });
});
