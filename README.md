# Portfolio site

My portfolio, on Angular 22 with the signals API, strict compiler rules and no `any` anywhere, in
English, German and Romanian. It is prerendered to static HTML at build time, so it is a folder of
files a plain web server can hand out, and a crawler receives real content rather than an empty
shell.

- **Live site:** https://christianszasz.dev

| Path | What it holds |
| --- | --- |
| `landingpage/` | The site itself, with its unit tests and its Playwright browser tests |
| `analytics/` | The .NET API that counts views and, with consent, what a reader does; see [analytics/README.md](analytics/README.md) |
| `admin/` | The dashboard over what the API collected; see [admin/README.md](admin/README.md) |
| `dev/` | Windows launchers for the whole local stack |

The Azure templates that host all of this live in a separate infrastructure repository.

## Tests and checks

Each part is checked the same way: strict compiler rules, a linter, and unit tests beside the code
they test. The browser tests in `landingpage/e2e/` drive the production build in Playwright, served
the way the host serves it, on a desktop and on a phone. The counter API is stubbed so no test
reaches a real backend, and every test fails on a console error, an uncaught exception or a request
that leaves the site, so a style the CSP refuses breaks the test that caused it.

## Strictness

`tsconfig.json` turns on the whole strict family plus `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals` and
`noUnusedParameters`. Templates are type-checked as code through `strictTemplates`,
`typeCheckHostBindings` and `strictStandalone`, with extended diagnostics raised to errors.
`strict` removes any route to an implicit `any`, ESLint closes the explicit one, and there is no
`any` in `src/`.

## Signals and streams

Everything reactive is a signal, and everything asynchronous is a stream. Components hold signals;
services answer with observables and never with promises, which keeps a call cancellable and lets
one call follow another. The lint rules enforce both: a service may not be `async`, may not
`await`, and may not import `firstValueFrom` or `lastValueFrom`.

The effects are Angular directives, one each for tilt, magnetic pull, parallax, drift, counters,
reveal and split text, writing custom properties through host bindings rather than touching the
DOM. The pieces my other sites share, the pointer and scroll services, the cursor, the backdrops
and every glyph, live in my private `common-web` package.

## SEO

`outputMode: "static"` in `angular.json` prerenders every route at build time. `SeoService` sets
the title, description, Open Graph, Twitter, canonical and hreflang tags per route, and because it
runs during prerendering those tags are in the delivered HTML. The home page is 1,218 words of real
markup with JavaScript disabled. `sitemap.xml` is generated from the prerendered output, so it
cannot advertise a page that was not built.

## Languages

English, German and Romanian, through `@angular/localize`. Each language is compiled as its own
build, so a translated page is real HTML rather than a dictionary applied in the browser, and it
reads the same with scripting off. `messages.de-DE.json` and `messages.ro-RO.json` are checked-in
translations, not build products, and `i18nMissingTranslation` is `error`, so a missing one fails
the build.

Every language is a folder of real prerendered files, and the path names it: `/cv` is the English
CV, `/de-DE/cv` the German one, `/ro-RO/cv` the Romanian, with English at the root. So a deep link,
a reload and a reader without scripting all land on the right language, with no rewrite and no
redirect.

## Styling

`src/styles.scss` holds the design system in a fixed `@layer` order; a block that belongs to one
component lives with that component, in nested BEM. Angular Material is carried for one thing,
`MatDialog`, which hosts the CV pop-up with a real focus trap, Escape handling and focus
restoration. Its schematic's Google Fonts links are stripped so the site keeps its promise of no
external request, and its unlayered overrides are neutralised so they cannot beat the design tokens.

## Hosting

The site is built for Azure Static Web Apps. `site-tools headers`, the last postbuild step, writes
`staticwebapp.config.json` into the build: the security headers with this build's CSP hashes, long
caching for the hashed files, the favicon rewrite and a 404 page that answers in the language of the
address.

The analytics API lives on its own origin, `https://api.christianszasz.dev`, named once in
`site.config.json` as `api`. A deployed page calls it there, and the CSP allows it and nothing else;
a page served from this machine calls `/api` instead, which the local servers proxy to the local
API, so a local build never reaches production. The build tooling lives in my private
`@christian-szasz-portfolio/common-web` package.

## Known limitations

- **It does not build from a clone.** The site, the API and the admin tool depend on private
  packages from my Common library. They live on a private package feed, so without access to it the
  install fails, and a clone is for reading the code. The live site is the running copy.

## Notes

- Dark is the default and does not follow the OS; the inline script in `index.html` applies a
  stored choice before first paint.

## Licence

All rights reserved. You may read, clone and run the code to evaluate my work; any other use needs
my permission. See [LICENSE](LICENSE).

---

*This project has been co-authored by Claude Code.*
