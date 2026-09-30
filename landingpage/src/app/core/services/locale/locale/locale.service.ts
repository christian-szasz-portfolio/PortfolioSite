import { DOCUMENT, LOCALE_ID, Service, inject } from '@angular/core';

import { LangUrlUtils } from '../../../utils/lang-url/lang-url.utils';

/** A language the site is published in */
export interface SiteLocale {
  readonly code: string;
  /** What the reader sees, written in that language rather than translated */
  readonly label: string;
  /** The short form for a narrow control */
  readonly short: string;
  /** Where its build sits, empty for the one served from the root */
  readonly subPath: string;
  /** The region og:locale adds to a bare language code */
  readonly territory?: string;
}

/** The three published languages; English has no prefix, its build being the one at the root */
const ENGLISH: SiteLocale = { code: 'en-GB', label: 'English', short: 'EN', subPath: '' };

export const siteLocales: readonly SiteLocale[] = [
  ENGLISH,
  { code: 'de', label: 'Deutsch', short: 'DE', subPath: 'de-DE', territory: 'DE' },
  { code: 'ro', label: 'Română', short: 'RO', subPath: 'ro-RO', territory: 'RO' },
];

/** Knows the language being read and where its siblings are; switching is a real navigation */
@Service()
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly localeId = inject(LOCALE_ID);

  public readonly locales = siteLocales;

  public get current(): SiteLocale {
    // A build for a language not published here still has to render something
    return this.locales.find((locale) => locale.code === this.localeId) ?? ENGLISH;
  }

  /** The address of the page being read, in another language: the same route in its folder */
  public urlFor(target: SiteLocale, path?: string): string {
    const rest = this.bare(path ?? this.document.location.pathname);
    return LangUrlUtils.withLangPrefix(rest, target.subPath);
  }

  /** A path reduced to the route it names, whichever language folder it sits in */
  private bare(pathname: string): string {
    const prefixes = this.locales.map((locale) => locale.subPath);
    return LangUrlUtils.withoutLangPrefix(pathname.split('?')[0] ?? '/', prefixes);
  }
}
