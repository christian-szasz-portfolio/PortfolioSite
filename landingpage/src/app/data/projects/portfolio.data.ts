/** Portfolio site: this site, with no demo beyond itself */

import { BlockKind, CalloutTone, Project, ProjectPage } from '../content.types';
import { diagram } from './diagrams';

export const portfolio: Project = {
  slug: 'portfolio',
  index: '04',
  title: 'Portfolio site',
  tagline: $localize`:@@work.portfolio.tagline.text:The site you are reading, prerendered to static HTML in English, German and Romanian, with a first-party analytics API that hears only from readers who consent.`,
  summary: $localize`:@@work.portfolio.summary.text:Every address is a real file in its own language, so a crawler, a reader without scripting and a deep link all get the page itself. Angular then hydrates the markup it was sent instead of drawing it again.`,
  note: $localize`:@@work.portfolio.note.text:Every layer boundary is a lint rule rather than a convention. Shared once imported a feature, and the compiler and every test stayed green.`,
  facts: [
    {
      key: $localize`:@@work.portfolio.fact.1.label:Role`,
      value: $localize`:@@work.portfolio.fact.1.value:Sole author, design, front end, API and deployment`,
    },
    {
      key: $localize`:@@work.portfolio.fact.2.label:Shape`,
      value: $localize`:@@work.portfolio.fact.2.value:A prerendered Angular 22 site, a .NET 10 analytics API and an admin dashboard`,
    },
    {
      key: $localize`:@@work.portfolio.fact.3.label:Languages`,
      value: $localize`:@@work.portfolio.fact.3.value:English, German and Romanian, each compiled as its own build`,
    },
    {
      key: $localize`:@@work.portfolio.fact.4.label:Pages`,
      value: $localize`:@@work.portfolio.fact.4.value:27 pages of real HTML: nine routes in three languages`,
    },
    {
      key: $localize`:@@work.portfolio.fact.5.label:Tests`,
      value: $localize`:@@work.portfolio.fact.5.value:636 frontend specs, 572 browser tests, 193 backend test methods`,
    },
    {
      key: $localize`:@@work.portfolio.fact.6.label:Public repository`,
      value: $localize`:@@work.portfolio.fact.6.value:The complete source of the site you are reading`,
    },
  ],
  chips: ['Angular 22', 'Signals', 'RxJS', 'SCSS', '.NET 10', 'Azure', 'Playwright', 'Vitest'],
  repository: 'https://github.com/christian-szasz-portfolio/PortfolioSite',
  media: {
    label: $localize`:@@work.portfolio.media.label:portfolio · this site`,
    poster: 'assets/img/portfolio-1280.jpg',
    clip: null,
    alt: $localize`:@@work.portfolio.media.alt:The portfolio home page in dark mode: a band of technology tags, the headline, a short introduction and the buttons to the work and to more about me.`,
  },
  reversed: true,
  languages: ['TypeScript', 'C#'],
};

export const portfolioPage: ProjectPage = {
  slug: 'portfolio',
  description: $localize`:@@work.portfolio.page.text:The portfolio site in detail: prerendered static HTML in three languages, content as typed data, layering held by lint rules, and a consent-gated analytics API on .NET 10.`,
  articles: [
    {
      id: 'overview',
      heading: $localize`:@@work.portfolio.overview.title:Overview`,
      lede: portfolio.tagline,
      blocks: [
        {
          kind: BlockKind.Prose,
          text: $localize`:@@work.portfolio.overview.usecase.text:A recruiter opens a link to the German CV on a phone with scripting blocked. The whole CV arrives in German anyway, because the address names a file that already holds it.`,
        },
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.portfolio.overview.item.1:Read four case studies, the CV and the legal pages in English, German or Romanian`,
            $localize`:@@work.portfolio.overview.item.2:Download the CV as a PDF, built in the browser`,
            $localize`:@@work.portfolio.overview.item.3:Switch between dark and light, with the choice kept for the next visit`,
          ],
        },
        diagram(
          'portfolio/use-cases',
          1280,
          780,
          $localize`:@@work.portfolio.figure.usecases.alt:Use case diagram: a reader browses four case studies, opens the CV and downloads it as a PDF, switches language and theme, and accepts or declines usage statistics; only with consent does the analytics API count one view a day and record interactions in batches; the owner reviews the figures and receives a morning digest.`,
          $localize`:@@work.portfolio.figure.usecases.caption:Everything a reader does works without the API; counting starts only once they agree.`,
        ),
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.portfolio.overview.live.label:No separate demo`,
          text: $localize`:@@work.portfolio.overview.live.text:The page you are reading is the running instance, and the repository holds all of its source.`,
          tone: CalloutTone.Aside,
        },
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.portfolio.overview.callout.label:Engineering note`,
          text: portfolio.note,
          tone: CalloutTone.Note,
        },
        { kind: BlockKind.Specs, rows: portfolio.facts },
      ],
    },
    {
      id: 'architecture',
      heading: $localize`:@@work.portfolio.architecture.title:Architecture`,
      lede: $localize`:@@work.portfolio.architecture.text.1:A static site that stands on its own, and an API it can do without.`,
      blocks: [
        diagram(
          'portfolio/architecture',
          1280,
          740,
          $localize`:@@work.portfolio.figure.architecture.alt:Architecture diagram: the browser loads prerendered pages from Azure Static Web Apps and calls the analytics API only with consent; the API passes through Analytics.Api, Analytics.Domain and Analytics.Infrastructure to Azure Table storage; a wake job triggers the morning digest, the admin dashboard reads the same table, and the shared Common packages come from a private package feed.`,
          $localize`:@@work.portfolio.figure.architecture.caption:Left of the dashed line is everything that still works while the API sleeps.`,
        ),
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.portfolio.architecture.item.1:Every route is prerendered at build time, so the host is a folder of files with no server of its own.`,
            $localize`:@@work.portfolio.architecture.item.2:Each language is its own build in its own folder, /de-DE/cv for instance, because Azure Static Web Apps cannot route on a query string.`,
            $localize`:@@work.portfolio.architecture.item.3:The Angular app is layered data, core, shared, layout and features, the arrow pointing one way, and no feature imports another.`,
            $localize`:@@work.portfolio.architecture.item.4:The API scales to zero, and the page never waits for it: when it does not answer, the view counter is simply absent.`,
          ],
        },
      ],
    },
    {
      id: 'domain',
      heading: $localize`:@@work.portfolio.domain.title:Domain design`,
      lede: $localize`:@@work.portfolio.domain.text.1:The content is typed data, so a case study that breaks the shape does not compile.`,
      blocks: [
        diagram(
          'portfolio/build',
          1280,
          620,
          $localize`:@@work.portfolio.figure.build.alt:Pipeline diagram: typed content, translations and components go into ng build, one build per language; prerendering writes 27 pages; the sitemap, the style hashes and the host configuration are generated from that output; a folder of files goes to Azure Static Web Apps.`,
          $localize`:@@work.portfolio.figure.build.caption:Typed content in, a folder of files out. A missing translation stops the line at ng build.`,
        ),
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.portfolio.domain.item.1:Every string a reader sees carries a stable message id, so a new extraction never orphans a translation.`,
            $localize`:@@work.portfolio.domain.item.2:A missing translation fails the build instead of falling back to English.`,
            $localize`:@@work.portfolio.domain.item.3:Below the features, content comes from its own file and never the barrel, or every case study would join the first download.`,
          ],
        },
      ],
    },
    {
      id: 'flow',
      heading: $localize`:@@work.portfolio.flow.title:Data and control flow`,
      lede: $localize`:@@work.portfolio.flow.text.1:One visit, from the address to the view counter.`,
      blocks: [
        diagram(
          'portfolio/visit',
          1280,
          760,
          $localize`:@@work.portfolio.figure.visit.alt:Sequence diagram: the browser requests /de-DE/cv and receives prerendered HTML with its CSP; Angular hydrates the markup; after the reader accepts the consent banner, the page posts one view a day, the API resolves the country from the request, buffers the count for Azure Table and answers with the totals; interactions follow as a keepalive request; if the API does not answer, an info banner appears and the page carries on.`,
          $localize`:@@work.portfolio.figure.visit.caption:The page has everything it needs before the first request to the API is made.`,
        ),
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.portfolio.flow.callout.label:Why the country is not a field`,
          text: $localize`:@@work.portfolio.flow.callout.text:A field in the request is one the caller controls, and the country is exactly what the caller must not control.`,
          tone: CalloutTone.Note,
        },
      ],
    },
    {
      id: 'testing',
      heading: $localize`:@@work.portfolio.testing.title:Testing strategy`,
      lede: $localize`:@@work.portfolio.testing.text.1:A spec beside every unit, and browser tests against the build the host will serve.`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.portfolio.testing.item.1:The run fails when a component, service, directive, pipe or util has no spec beside it.`,
            $localize`:@@work.portfolio.testing.item.2:Playwright drives the production build on a desktop and a phone, served with the host's own routes, headers and CSP.`,
            $localize`:@@work.portfolio.testing.item.3:Every browser test fails on a console error, an uncaught exception or a request that leaves the site.`,
            $localize`:@@work.portfolio.testing.item.4:The .NET projects build with StyleCop and warnings as errors, and the domain references no package at all, so the compiler holds its direction.`,
          ],
        },
      ],
    },
    {
      id: 'changes',
      heading: $localize`:@@work.portfolio.changes.title:What I would change`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.portfolio.changes.item.1:The case studies are TypeScript, so fixing a typo in one takes a build and a deploy.`,
            $localize`:@@work.portfolio.changes.item.2:The development server localizes one language at a time, so checking a German page needs a second command.`,
            $localize`:@@work.portfolio.changes.item.3:The host allows one 404 page, so a small script fetches the right language in its place. A host with a 404 per folder would not need it.`,
            $localize`:@@work.portfolio.changes.item.4:The feature boundaries in the lint config are listed by hand: a new feature means editing the config as well.`,
          ],
        },
      ],
    },
  ],
};
