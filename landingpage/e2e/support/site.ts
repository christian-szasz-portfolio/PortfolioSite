import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The published languages, as the host lays them out */
export enum Lang {
  English = 'en-GB',
  German = 'de',
  Romanian = 'ro',
}

export interface LocaleInfo {
  readonly lang: Lang;
  /** The folder its build sits in, empty for English at the root */
  readonly prefix: string;
  /** The short form the switcher shows */
  readonly short: string;
  /** The translation file, absent for the source language */
  readonly messages: string | null;
}

export const locales: readonly LocaleInfo[] = [
  { lang: Lang.English, prefix: '', short: 'EN', messages: null },
  { lang: Lang.German, prefix: '/de-DE', short: 'DE', messages: 'messages.de-DE.json' },
  { lang: Lang.Romanian, prefix: '/ro-RO', short: 'RO', messages: 'messages.ro-RO.json' },
];

export function localeOf(lang: Lang): LocaleInfo {
  const found = locales.find((locale) => locale.lang === lang);

  if (found === undefined) {
    throw new Error(`No locale ${lang}`);
  }

  return found;
}

/** English source text for the ids the specs read; the other languages come from their files */
const ENGLISH: Readonly<Record<string, string>> = {
  'nav.work.label': 'Work',
  'nav.thinking.label': 'Thinking',
  'nav.about.label': 'About',
  'nav.menu.label': 'Menu',
  'notFound.title': 'That page is not here',
  'cv.modal.title': 'Curriculum vitae',
  'consent.accept.cta': 'Accept',
  'consent.decline.cta': 'Decline',
  'theme.toLight.cta': 'Switch to light',
  'theme.toDark.cta': 'Switch to dark',
  'footer.sitemap.cta': 'Sitemap',
  'footer.cookies.cta': 'Cookies',
  'privacy.title': 'Privacy policy',
  'terms.title': 'Terms and conditions',
  'error.text': 'Try reloading?',
};

const cache = new Map<string, Readonly<Record<string, string>>>();

function translations(locale: LocaleInfo): Readonly<Record<string, string>> {
  if (locale.messages === null) {
    return ENGLISH;
  }

  const known = cache.get(locale.messages);

  if (known !== undefined) {
    return known;
  }

  const file = path.resolve('src/locale', locale.messages);
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { translations: Record<string, string> };
  cache.set(locale.messages, parsed.translations);

  return parsed.translations;
}

/** What the page says for a message id in a language, as the build was given it */
export function t(lang: Lang, id: string): string {
  const text = translations(localeOf(lang))[id];

  if (text === undefined) {
    throw new Error(`No text for ${id} in ${lang}`);
  }

  return text;
}

export interface ProjectInfo {
  readonly slug: string;
  readonly title: string;
  readonly repository: string | null;
  /** Whether the repository and the live instance are a demo, and say so */
  readonly demo: boolean;
  /** Whether the hero plays a clip, or shows its poster alone */
  readonly clip: boolean;
  /** Case-study diagrams, each opening the diagram viewer */
  readonly figures: number;
  /** Code blocks, each with a copy button */
  readonly codeBlocks: number;
}

/** The counter API's origin, which the built site calls across origins */
export const apiOrigin: string = new URL(
  (JSON.parse(readFileSync(path.resolve('src/site.config.json'), 'utf8')) as { api: string }).api,
).origin;

/** Document order, which the home cards and the pager follow */
export const projects: readonly ProjectInfo[] = [
  {
    slug: 'stack86',
    title: 'Stack86',
    repository: 'https://github.com/christian-szasz-portfolio/Stack86',
    demo: true,
    clip: true,
    figures: 4,
    codeBlocks: 0,
  },
  {
    slug: 'taskly',
    title: 'Taskly',
    repository: 'https://github.com/christian-szasz-portfolio/Taskly',
    demo: true,
    clip: true,
    figures: 4,
    codeBlocks: 0,
  },
  {
    slug: 'assembler',
    title: 'Assembler',
    repository: null,
    demo: false,
    clip: true,
    figures: 0,
    codeBlocks: 1,
  },
  {
    slug: 'portfolio',
    title: 'Portfolio site',
    repository: 'https://github.com/christian-szasz-portfolio/PortfolioSite',
    demo: false,
    clip: false,
    figures: 4,
    codeBlocks: 0,
  },
];

/** Every article a case study has, in page order */
export const articleIds: readonly string[] = [
  'overview',
  'architecture',
  'domain',
  'flow',
  'testing',
  'changes',
];

/** Every prerendered route, without a language prefix */
export const routes: readonly string[] = [
  '/',
  '/cv',
  '/privacy',
  '/terms',
  ...projects.map((p) => `/work/${p.slug}`),
];

/** The home page sections the header links to */
export enum Section {
  Work = 'work',
  Thinking = 'thinking',
  About = 'about',
}

/** The localStorage keys the site owns */
export enum StorageKey {
  Consent = 'cs-consent',
  Theme = 'cs-theme',
  ViewsDay = 'cs-views-day',
}

export enum ConsentChoice {
  Unset = 'unset',
  Granted = 'granted',
  Denied = 'denied',
}

export enum ThemeName {
  Dark = 'dark',
  Light = 'light',
}
