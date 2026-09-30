# Pipes

Two, and each earns its place: it gives a template a value the component has no
other reason to hold.

- `reading-time.pipe.ts` turns a word count into "N minute read" for the project
  pages. The count is data; the wording is presentation, and belongs here.
- `demo-url.pipe.ts` swaps a deployed demo's address for its local stand-in when
  the page is served from this machine, so a local run of the site links the
  local demos rather than production. The mapping and the check are pure and live
  in `core/utils/demo-url`; the pipe only reads this page's host and applies them.

There was a `trust-resource.pipe.ts` here that wrapped
`bypassSecurityTrustResourceUrl` behind an allow-list, for embedding an
`iframe`. It was removed: nothing had used it since `CvViewerComponent` stopped,
and a sanitizer bypass with no caller is the kind of thing that gets reached for
later without anyone re-reading the guard it came with. The site frames nothing,
and its CSP now says `frame-src 'none'` to match. If a frame is ever genuinely
needed, write the bypass again alongside the template that needs it, so the two
are read together.

What is deliberately not a pipe:

- The stat figures are formatted by `Intl.NumberFormat` inside
  `counter.directive.ts`, because the directive animates the number and has to
  own the formatting of every intermediate value, not just the final one.
- The marquee duration is a `computed` on the component, since it is a style
  binding rather than displayed text.

Name a new one `<thing>.pipe.ts`, leave it pure unless it genuinely cannot be,
and give it a spec alongside.

---

*This project has been co-authored by Claude Code.*
