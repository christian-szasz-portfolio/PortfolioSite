/** Everything on the site that is not a project */

import site from '../../site.config.json';
import { ContactRow, Pillar, Stat } from './content.types';

/** The site's own address, and the only copy of it. */
export const siteUrl: string = site.url;

/** The counter API's own origin, which a built site calls across origins. */
export const apiUrl: string = site.api;

/** The live demos, which every visit wakes and the CSP allows to be called. */
export const demoUrls: readonly string[] = site.demos;

/** Who the site is about, as schema.org, written into every page by SeoService. */
export const person = {
  '@type': 'Person',
  name: 'Christian-Ioan Szasz',
  jobTitle: 'Software Engineer',
  url: `${siteUrl}/`,
  email: 'mailto:christian.ioan.szasz@gmail.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Sibiu',
    addressCountry: 'RO',
  },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Lucian Blaga University of Sibiu',
  },
  knowsLanguage: ['Romanian', 'German', 'English'],
  knowsAbout: [
    '.NET',
    'C#',
    'Angular',
    'TypeScript',
    'React',
    'Microsoft Azure',
    'Event-driven architecture',
    'CQRS',
    'Saga',
    'SQL Server',
    'Compilers',
    '8086 assembly',
    'Embedded systems',
  ],
  sameAs: [
    'https://www.linkedin.com/in/christian-szasz',
    'https://github.com/christian-szasz-portfolio',
  ],
} as const;

export const stats: readonly Stat[] = [
  { label: $localize`:@@stats.since.label:Writing software since`, value: 2022, plain: true },
  { label: $localize`:@@stats.projects.label:Built on my own time`, value: 4 },
  // 4,898 backend, 3,741 frontend and 672 end-to-end, summed from the four case studies
  { label: $localize`:@@stats.tests.label:Tests standing behind them`, value: 9300, suffix: '+' },
  { label: $localize`:@@stats.warnings.label:Build warnings tolerated`, value: 0 },
];

export const contact: readonly ContactRow[] = [
  {
    id: 'email',
    key: $localize`:@@contact.email.label:Email`,
    text: 'christian.ioan.szasz@gmail.com',
    href: 'mailto:christian.ioan.szasz@gmail.com',
  },
  {
    id: 'linkedin',
    key: $localize`:@@contact.linkedin.label:LinkedIn`,
    text: 'in/christian-szasz',
    href: 'https://www.linkedin.com/in/christian-szasz',
  },
  {
    id: 'github',
    key: $localize`:@@contact.github.label:GitHub`,
    text: 'christian-szasz-portfolio',
    href: 'https://github.com/christian-szasz-portfolio',
  },
  {
    id: 'languages',
    key: $localize`:@@contact.languages.label:Languages`,
    // Three pieces rather than one string, so each can carry the flag of its own region.
    parts: [
      { code: 'RO', text: $localize`:@@contact.languages.ro:Romanian native` },
      { code: 'DE', text: $localize`:@@contact.languages.de:German native, DSD C1` },
      { code: 'GB', text: $localize`:@@contact.languages.en:English C1` },
    ],
  },
];

export const technologies: readonly (readonly string[])[] = [
  [
    'C#',
    '.NET 10',
    'ASP.NET Core',
    'Angular',
    'TypeScript',
    'Signals',
    'NgRx',
    'RxJS',
    'SCSS',
    'Azure',
    'Azure Functions',
    'Service Bus',
    'Rebus',
    'CQRS',
    'Saga',
  ],
  [
    'SQL Server',
    'EF Core',
    'Blob Storage',
    'Docker',
    'GitHub Actions',
    'Playwright',
    'Vitest',
    'MSTest',
    '.NET MAUI',
    'Vite',
    'React',
    'JavaScript',
    'PowerShell',
    'n8n',
    'Claude Code',
    'GitHub Copilot',
  ],
];

export const pillars: readonly Pillar[] = [
  {
    index: '01',
    title: $localize`:@@pillar.1.title:Keep the core independent`,
    text: $localize`:@@pillar.1.text:The part of a system that holds the rules should not depend on what surrounds it. Then changing the screen or the storage never puts the rules at risk.`,
  },
  {
    index: '02',
    title: $localize`:@@pillar.2.title:Tests do not tell you it looks right`,
    text: $localize`:@@pillar.2.text:A passing suite tells me the logic works, not that the screen is usable. I answer the second question by looking.`,
  },
  {
    index: '03',
    title: $localize`:@@pillar.3.title:Faster drafts, same bar`,
    text: $localize`:@@pillar.3.text:I use AI tooling every day and it makes me faster. It has not lowered the bar a change has to clear before it ships.`,
  },
];
