# Counter API

First-party view counter for the landing site. .NET 10 ASP.NET Core, endpoints written with
[FastEndpoints](https://fast-endpoints.com) in the REPR shape: one class per endpoint, holding
its own route, its own response type and a single handler.

## Projects

| Project | Holds | References |
| --- | --- | --- |
| `Analytics.Domain` | Models, the contracts (`IViewStore`, `ICounterTable`, `IGeoResolver`) and the counting policy in `TableViewStore`. | nothing |
| `Analytics.Infrastructure` | Azure Table and DB-IP implementations, the options, and the `AddCounter` composition root. | Domain |
| `Analytics.Api` | The host, the FastEndpoints endpoints, the middleware and `X-Forwarded-For` parsing. | Domain, Infrastructure |
| `Analytics.Tools` | Operational tasks: `geoip` refresh, `verify` security probe, `digest` email preview, `mail` SMTP check. | Domain, Infrastructure |

Domain has no package references at all, so it cannot reach Azure, MaxMind, FastEndpoints or
ASP.NET Core even by accident: the compiler enforces the direction rather than a convention doing it.
Every project is grouped by role rather than left flat, and the largest folder holds seven files:

```
Analytics.Domain/          Abstractions/{Geography,Resilience,Storage,Views}, Models, Resilience,
                           Storage, Views, Usage/{Abstractions,Catalogue,Models,Storage}
Analytics.Api/             Configuration, Endpoints/{Views,Interactions,Diagnostics}, Health,
                           Http/Callers
Analytics.Infrastructure/  Buffering, Configuration, Diagnostics/Storage, Geo, Retention, Tables,
                           Usage
Analytics.Tools/           Diagnostics, Geo, Security, with Program at the root
```

The security middleware, the log capture and digest machinery, and the HTML builder the digest is
written with are shared with my other apps, so they come from my private Common packages:
`Common.Security`, `Common.Diagnostics` and `Common.Html`. This
project supplies what is its own: the counting, the storage, the endpoints and the digest's figures.

Namespaces follow the folders, and `IDE0130` fails the build on any that drifts.

Tests live in `../analytics.tests`, grouped to mirror the projects (`Domain/`,
`Infrastructure/`, `Api/`, `Html/`, `Tools/`, plus `Fakes/` for the shared doubles and
`Architecture/` for the rules that hold across them), so a test sits where its subject does.
Namespaces follow the folders and `IDE0130` enforces it, because a layout nothing checks drifts
back to flat. `../Analytics.slnx` builds all five.

## Endpoints

One class each, in `Analytics.Api/Endpoints`, which is what the REPR shape buys: the route, the
response type and the handler for a request sit together, and adding an endpoint adds a file
rather than a method to a growing controller.

- `GetViewsEndpoint` - `GET /api/views` : returns `{ total, countries: [{ code, count }] }` without recording.
- `PostViewsEndpoint` - `POST /api/views` : records one view, then returns the same shape.
- `PostInteractionsEndpoint` - `POST /api/interactions` : counts a batch of things a reader did,
  and answers `{ accepted, rejected }`.

Both view endpoints are `EndpointWithoutRequest<ViewStats>`. Neither takes a request body, and inventing an
empty DTO to look more like the pattern would be the wrong kind of faithful: what identifies a
view is the country resolved from the caller's address, which is read from the request rather
than accepted from it. A request field there would be one the caller controls, and the country is
exactly the thing it must not.

`OPTIONS` is answered by `CorsMiddleware` (from `Common.Security`) before routing, so preflight
needs no endpoint.

Country is resolved from the caller IP (`X-Forwarded-For`) against a bundled offline
DB-IP Lite database (`Analytics.Api/Data/dbip-country-lite.mmdb`). The IP is used only for that in-process
lookup and is never passed to storage or written to a log by this code. Only aggregate
per-country totals are kept, in one Azure Table partition (`site`): a `TOTAL` row and one
`C_<code>` row per country, incremented with ETag optimistic concurrency.

## Patterns worth knowing

- **Specification** - `CounterWrite` replaces the old `InsertAsync` / `UpdateAsync` pair.
  A private constructor with two named factories, `Insert` and `Update`, so an update cannot
  be described without the ETag it is guarded by, and `ICounterTable` has one `WriteAsync`
  instead of two nearly identical methods.
- **Strategy** - `IRetryPolicy` / `ConcurrencyRetryPolicy` owns how a lost ETag race is
  retried, so `TableViewStore` is left with the counting. Attempts come from
  `MaxWriteAttempts`, and the policy is tested on its own.
- **Factory** - `IGeoResolverFactory` decides between the real DB-IP resolver and the null one.
  It probes the file system through `IFileProbe`, so the decision is testable rather than a
  bare `File.Exists` buried in the DI extension.
- **DRY** - `CounterRowKey` is the only place that knows how rows are named, used by both the
  writes and the read that parses them back.
- **Single responsibility, across all three projects** - the view endpoints do not read
  headers or resolve geography: `IVisitorCountry` does that. `ViewNudges` names the channel, so the container
  binds one type instead of three generic ones. Adding buffered tallies to stored ones moved
  onto `ViewStats.CombinedWith`, since it is stats maths rather than something a buffer owns.
  `AddCounter` is four named steps, and the host registers its own HTTP concerns through
  `AddCounterHttp`, because those types know about the ASP.NET Core request model and
  Infrastructure must not.

## How a view is counted

A request does not wait on storage. `BufferedViewStore` bumps an in-memory counter per country
with `Interlocked`, nudges a bounded `Channel`, and answers from stored totals plus what is
still buffered, so a visitor always sees their own view. `ViewFlushService` wakes on that
channel or on `FlushInterval`, takes the whole buffer and writes one row per country plus one
total. A batch of a hundred views costs as many writes as it has distinct countries, plus one,
instead of two read-modify-writes per request.

The channel carries nudges, not counts, and drops the oldest when full: the tallies are already
safe in the buffer, so a dropped nudge loses nothing. A failed write hands the batch back to the
buffer rather than swallowing it, and stopping flushes what is left.

**A read and a flush are held apart** by `ViewFlushGate`, and this is load bearing rather than
defensive. A counted view is in exactly one of two places, the buffer or storage, and a flush
moves it between them in two steps that a read can land between. Reading storage first and the
buffer second loses the view: the flush empties the buffer while the read is still waiting on
storage, before its write has landed, and the view is then in neither place. Reading them the
other way round double counts it instead. Keeping the taken batch published until the write
finishes only moves the double count to the window between the write landing and the batch being
dropped, and a version counter with a retry cannot see the case that matters, a flush that began
before a read and ends after it. The write landing in storage happens in another process and is
simply not observable here, so the two are serialised instead. A read may therefore wait for one
flush's write, on a path that already makes a storage round trip of its own.

This was a real defect, not a hypothetical: a POST would occasionally answer with a total that
excluded the view it had just recorded, roughly one in ten under a rapid burst.

**The trade is durability.** Views counted but not yet flushed are lost if the host dies without
a graceful shutdown, which a Consumption plan does not guarantee. That is acceptable for a view
counter and would not be for anything that has to balance. Shorten `FlushInterval` to narrow the
window, at the cost of more writes.

## How an interaction is counted

Views are one of two things the page reports. The other is what a reader did with it: a page
opened, a section reached by scrolling, the CV opened, either CV download, a project opened from
its card. The page batches them and posts one request every few seconds, and only once the
visitor has agreed to be counted.

**A day at a time, in the same table.** Interactions are counted in memory and written behind the
request by `UsageFlushService`, exactly as views are: one partition per day (`usage-2026-09-06`),
one row per operation, plus a row for views and one for refusals. What is stored is a count and
nothing else. No identifier, no session, no address and no order of events, and `Interaction` has
nowhere to put one, which is why the endpoint can be anonymous and still answer the only question
it is asked: how much was the page used.

They were in memory only to begin with, which lost the day on any restart before the digest went
out and gave each instance its own half of the numbers. The rows fix both. Reading a day back:

```
dotnet run --project analytics/Analytics.Tools -- usage [yyyy-MM-dd]
```

**`InteractionCatalogue` is the extension point and the allowlist at once.** Counting something
new is one entry there and one call from the page:

```csharp
public static readonly InteractionKind CvPdf =
    InteractionKind.Named("cv.download.pdf", "CV downloaded as PDF", 40);
```

The endpoint, the tally and the digest are written against the catalogue rather than against any
particular kind, so none of them changes. Because names arrive in a request body, the endpoint
resolves through the catalogue and refuses anything else: an unknown name is counted as a refusal
and goes no further, which keeps an unbounded set of names out of both the tally and the email. A
refusal is also logged, because a page newer than the API it is talking to is worth knowing about.

`InMemoryAnalyticsWindow` holds one counter per kind, moved with `Interlocked`, and is bounded by
construction: only catalogued kinds ever reach it. `IAnalyticsRecorder` and `IAnalyticsWindow` are
separate contracts over the one instance, so the request path can only add and the flusher can
only take. A failed write hands the counts back rather than swallowing them.

**The digest reports a day, not an interval.** Usage is stored a day at a time, so
`IDigestSchedule.ReportsOn` says which: the daily cadence reports the day that has ended, because
the send is the morning after and that day is complete; the interval cadence a laptop uses reports
the day in progress, because there is nothing else worth looking at. The log entries in the same
email are still whatever was captured since the last one, and the email says so.

**One increment, two counters.** `ICounterIncrementer` owns the read-modify-write guarded by an
ETag, because Table Storage has no server-side increment and both the view counter and usage need
one. Every operation names its partition, so the view counter's read never grows as days
accumulate and a day of usage is read without scanning the days before it.

## Retention, and getting the data out

**Thirty days, then the day is deleted.** `RetentionService` drops expired partitions at
startup and once a day after that; `UsageRetentionDays` sets the window. At startup as well as on
the interval, because a host restarted every day would otherwise never reach the wait, and one
that was off for a month has a backlog the moment it returns.

It works on partition names alone and leaves alone anything it cannot read as one of our days, so
nothing that merely shares a prefix can be deleted by it, and the view counter's partition is
never in range. A failure is logged and left for tomorrow: storage being unreachable must not take
the API down, and a day outliving its window by a few hours is the smaller problem.

The period is in the privacy and cookies notices, in all three languages, which is the reason it
has to be enforced by something rather than left as an intention.

Anything wanted for longer than thirty days leaves before it expires:

```
dotnet run --project analytics/Analytics.Tools -- export [days] [path]   CSV for a spreadsheet
dotnet run --project analytics/Analytics.Tools -- usage [yyyy-MM-dd]     one day, printed
dotnet run --project analytics/Analytics.Tools -- prune [keep-from]      run retention now
```

The export is one row a day and one column an operation, with empty days written as zeroes rather
than left out, so a quiet week looks like a quiet week and not like missing data. That is the shape
a spreadsheet charts without being pivoted first.

## Rate limiting

A middleware refuses a caller that asks too often, before the function runs, and answers 429
with `Retry-After`. Callers are told apart by a **SHA-256 digest of the forwarded address**,
never the address itself: the site tells visitors their network address is never stored, and a
limiter has to remember callers for the length of a window, so it remembers a hash instead.

Limits are applied in **tiers** (`TieredRateLimiter`, from `Common.Security`), and the first
refusal decides. Per caller
comes first because it is the selective one. Behind it sits a **shared tier** counting every
caller together against one key, because a per-caller limit alone bounds nothing: enough distinct
addresses each stay inside their own allowance while the instance still pays a storage write for
every request. `InstanceRateLimitPermits` (600 a minute) is that ceiling, set well above what the
site itself generates so it is only ever reached by something that is not the site.

Both windows are **per instance**. Scale out and each instance allows the full allowance, so
whatever caps instance count on the chosen host is what bounds the multiplier. This blunts a flood
against one host; it is not a global quota.

The site limits itself too, in `rate-limit.utils.ts`, and honours the `Retry-After` it is given.

**Callers are identified from the right-hand end of `X-Forwarded-For`.** A client may send that
header itself and the platform appends to it, so the leftmost entry is whatever the caller
claimed: reading it would let anyone forge an address and take a fresh bucket per request.
`TrustedProxyCount` says how many hops at the right belong to infrastructure you control, and
defaults to 0. **Check it against a real request before trusting the limiter in production**:
too high hands callers a forgeable address again, too low puts every visitor in one bucket.

The header is also **joined across repeated header lines** before it is read. HTTP lets a header
arrive more than once and says the values are one list; a caller can send its own `X-Forwarded-For`
that the platform then appends to as a second line rather than editing. Reading only the first
line would read only the forgery, and each new forged value would buy a fresh bucket. Verified
against a running host: five requests with different forged prefixes and the same appended
address all landed in one bucket and the fourth was refused.

The partition table is **capped** (`MaxTrackedCallers`, 20,000 by default) and swept at most once
per window. Both matter: a table that grows a row per address is a way to exhaust a host's memory,
and sweeping on every request would walk the whole table every time, turning a burst of callers
into quadratic work. Past the cap, a caller the limiter has never seen is refused rather than
recorded; callers already tracked keep their allowance.

## CORS and response headers

Cross-origin access is enforced in code by `CorsMiddleware` from `Common.Security`, not left to
a portal setting.
`AllowedOrigins` is **empty by default**, which allows nothing: the site and the API share one
origin in production, so nothing cross-origin needs reading access. Origins are matched whole,
and `*` is treated as a literal rather than a pattern, so a misconfiguration fails closed.

Be clear about what this buys. CORS governs whether a **browser** lets script read the reply. It
does not stop the request arriving, so it is not what protects the counter from being inflated by
curl or a script tag: the rate limiter is.

`SecurityHeadersMiddleware` puts `Content-Security-Policy: default-src 'none'`,
`X-Content-Type-Options`, `Referrer-Policy: no-referrer` and `Cache-Control: no-store` on every
response. It is outermost in the pipeline, so a 429 carries them too. That last claim was a
comment until it was checked against a running host; a refusal does carry all four, plus
`Retry-After` and the CORS headers. Headers are **replaced rather than appended**, so an endpoint
that sets one of them itself leaves one value rather than two for an intermediary to choose from.

`Access-Control-Allow-Headers` answers a fixed `Content-Type` rather than echoing whatever the
caller put in `Access-Control-Request-Headers`. Reflecting a request header into a response is
how a value the caller wrote ends up in a header the browser trusts.

`appsettings.Development.json` is committed, because the only thing in it is the well-known
Azurite connection string and the dev server origin. A real connection string belongs in an
environment variable or user secrets, never in a file, and the file is excluded from publish so a
deployment cannot pick up the emulator string by accident.

## Configuration

- `AzureWebJobsStorage` : connection string for the Table Storage account (Azurite locally).
- `ViewsTableName` : table name, defaults to `views`.
- `FlushInterval` : how long buffered views may wait before a write, default 5s.
- `WakeUpQueueLength` : nudges that may queue before the oldest is dropped, default 64.
- `RateLimitPermits` : requests one caller may make per window, default 30.
- `RateLimitWindow` : the window those permits are counted over, default 1 minute.
- `TrustedProxyCount` : hops at the right of X-Forwarded-For you control, default 0.
- `AllowedOrigins` : comma-separated origins allowed to read a response, default none.

### Secrets

No secret is written in a committed file. Each one comes from the environment the API runs in:

| Setting | What it is | Locally | On Azure |
| --- | --- | --- | --- |
| `AzureWebJobsStorage` | The storage account's connection string | Azurite's public development string, in `appsettings.Development.json` | Container Apps secret `storage-connection`, built by the infrastructure repo's `container.bicep` from the account it creates |
| `Diagnostics:SmtpPassword` | The Gmail app password the digest is sent with | `dotnet user-secrets` | Container Apps secret `smtp-password` |
| `Diagnostics:TriggerKey` | The key the wake job proves itself with | `dotnet user-secrets`, only to try the endpoint | Container Apps secret `trigger-key` |

User secrets live in the developer's profile, outside the repository, and are read only in
Development. `Analytics.Tools` reads the same settings from environment variables instead.

## GeoIP database

`Analytics.Api/Data/dbip-country-lite.mmdb` is **not committed** (it is gitignored). It is DB-IP's
"IP to Country Lite" dataset, licensed **CC BY 4.0**, and is not redistributed in this repo.
`Analytics.Tools` fetches it, and a monthly run refreshes it.

Without the file the API still runs and records every view as an unknown country. Attribution
("IP geolocation by DB-IP, https://db-ip.com") is shown on the site's `/cookies` page.

What is downloaded is proved before it is put in place: the fetch is HTTPS-only, the archive is
refused if it unpacks past 512 MB, and the unpacked file is opened as a country database and asked
to resolve a known address. Only then does it replace the one already there, so a bad month leaves
the working database alone rather than the Function silently resolving every visitor to `ZZ` at its
next cold start. The SHA-256 of what landed is printed; DB-IP publishes nothing to compare it
against, so it is a value to record rather than a verification.

## What ships

The published app carries the host, `Analytics.Domain`, `Analytics.Infrastructure`, FastEndpoints and
the GeoIP database, and nothing else. `Analytics.Tools` is in the solution so the build checks it,
but nothing references it, so it is never packaged. `appsettings.Development.json` is kept out by
`CopyToPublishDirectory=Never`, so a deployment cannot pick up the emulator connection string.
Release builds emit no symbols, so no `.pdb` files ship; Debug keeps them for local work.

## Privacy / deploy checklist

The privacy policy tells visitors that their network address is never stored, recorded or
shared, and that the lawful basis is their **consent**. That claim is true of this application
code; it is only true end to end if the platform is configured not to log the client IP either. Before
deploying, verify:

- **Application Insights**: do not set `DisableIpMasking = true`. By default AI masks the
  client IP (stores `0.0.0.0`); leaving masking on keeps the claim true. If AI is not needed,
  it can be omitted entirely.
- **App Service / container access logs**: check that platform HTTP logging is not retaining
  client IPs (or is turned off). The same applies to any Kudu/diagnostic logging.
- **Anything in front** (Azure Front Door, a CDN, API Management): these log client IPs by
  default. Disable or scope that logging, or soften the page wording, so the two agree.
- **Lawful basis**: consent, under Article 6(1)(a) of the GDPR. Nothing is counted and no
  address is processed before a visitor accepts, and clearing the site data withdraws it.
- **DB-IP** updates monthly; refresh `Analytics.Api/Data/dbip-country-lite.mmdb` periodically. Attribution
  (CC-BY) is shown on the `/cookies` page.

## Emailed log digests

Warnings and above are captured alongside the console logger and posted as one HTML email per
window, rather than one per line: a logger that mails every entry is a way to flood a mailbox.

**Sections come from the code's own shape.** `NamespaceDomainResolver` (from `Common.Diagnostics`)
reads the domain out of the logger category, so `Analytics.Infrastructure.Buffering.ViewFlushService`
lands in a **Buffering** table and `Analytics.Api.Endpoints.Views.PostViewsEndpoint` in a **Views**
one. `PortfolioDomainResolver` sets the order for all three apps that share the digest: this API,
the Stack86 demo and the Taskly demo. A new class in an existing folder
gets the right section with no registration; only the ordering is curated, to keep the interesting
sections above the framework noise.

**Stack traces arrive whole.** `exception.ToString()` carries the type, the message, the stack and
every inner exception with its own stack, and none of it is trimmed anywhere on the way. Each one
sits in a `<pre>` under the row it belongs to, folded under its first line so a digest with several
failures stays readable. A client that does not support `<details>`, Gmail among them, shows it open.

Look at it before wiring anything:

```
dotnet run --project analytics/Analytics.Tools -- digest
```

That writes a sample with a genuine thrown-and-caught exception in it, so the preview shows what a
real failure will look like rather than a typed-out approximation.

To see it arrive through SMTP, start the local mail catcher and post the same sample to it:

```
docker compose -f dev/mail.compose.yml up -d
Diagnostics__SmtpHost=localhost Diagnostics__SmtpPort=1025 Diagnostics__SmtpSecurity=Off Diagnostics__Recipient=you@example.com dotnet run --project analytics/Analytics.Tools -- mail
```

It lands at http://localhost:8025. `SmtpSecurity` is `Auto` by default: SSL on 465, STARTTLS
anywhere else, and a refusal rather than a plain connection when the server offers neither.
`WhenAvailable` and `Off` exist only for a catcher like this one.

### When it is sent

**Production: daily at 09:00 Europe/Bucharest.** Development uses a two-minute interval, because
waiting until tomorrow morning to find out whether it works is no use.

A **zone**, not an offset, and that is not pedantry: Romania is UTC+2 in winter and UTC+3 in
summer, so a digest pinned to `+02:00` would arrive at 09:00 for half the year and 10:00 for the
other half. The zone is asked what the offset is on the day, every day, which is also why the wait
is recomputed each time rather than run off a `PeriodicTimer`.

The two hours a year that do not behave are handled rather than assumed away: a local time a
spring-forward skipped moves to the first moment that exists, and one an autumn-back repeated is
taken at its first occurrence so the digest goes out once, not twice. Nine in the morning is never
either of those in Romania; the code does not depend on that staying true, and tests pin both.

**`InvariantGlobalization` must stay off** in `Analytics.Api`. It disables ICU, and without ICU
`Europe/Bucharest` does not resolve. That was set when the project was created and the unit tests
did not catch it, because the test project has globalization on: the app failed at startup and
nothing else did.

A schedule that cannot be built **stops the digests and nothing else**. The default host behaviour
for an unhandled exception in a `BackgroundService` is to stop the host, which would take the
counter down because a time zone id was mistyped. The counter is the product; the emailed log is
not.

**A daily cadence means entries wait up to 24 hours**, so `Capacity` is 20,000 in production rather
than the 2,000 that suited a fifteen-minute window. Whatever it drops is still counted and reported
in the email.

### Configuration

Under a `Diagnostics` section, and nothing in it is committed: supply `SmtpHost`, `SmtpUser`,
`SmtpPassword` and `Recipient` through environment variables or user secrets. On Azure the
templates set them, with the recipient defaulting to the SMTP user. With no host and no recipient, `EmailTransportFactory` returns the transport that
discards, the API says so once at startup, and everything else runs unchanged. That is the normal
state of a fresh clone, not a fault.

### The shape of it

The machinery is `Common.Diagnostics`: the bounded buffer behind `ILogger`, the flush into the
table, the schedule, the composer and its section renderers, and the transports. This API supplies
the parts only it knows:

```
Analytics.Domain/Usage/
  Abstractions/   IInteractionCatalogue, IAnalyticsRecorder, IAnalyticsWindow, IUsageStore, IUsageRetention
  Catalogue/      the list of what is counted, which is also the allowlist
  Models/         InteractionKind, Interaction, OperationCount, AnalyticsSummary
  Storage/        the usage table, its row keys and its retention

Analytics.Infrastructure/Diagnostics/
  DigestSource.cs                    the day's kept entries and its usage, read into one window
  PortfolioApps.cs                   the three apps that share the digest
  PortfolioDomainResolver.cs         the order of their sections
  CounterTableDigestLedgerTable.cs   the ledger that lets a digest claim its day once
  AnalyticsDiagnosticsOptions.cs     this API's own table and wake key
  Storage/                           the table clients
```

The digest opens with three figures, which is what the counting is for: **views**,
**interactions**, and the **operations** those were, most used first. A window with only use in it
still sends, because a day on which nothing went wrong is the ordinary day and still the one worth
reading. `DigestSource` reads the kept entries and the usage for the same day, in two reads, so a
digest that fails to send leaves the day exactly as it found it.

Three things are load bearing rather than decorative, and the shared package holds all three:

- **Everything is HTML-escaped.** Entries carry messages and traces shaped by whatever caused them,
  and some of that arrived over HTTP. A log message is not a place markup may come from.
- **The buffer is bounded and drops rather than grows.** It sits behind every `ILogger` call, so it
  must never turn a burst of logging into the host running out of memory. What it drops is counted
  and reported in the email, so a digest never implies the window was quieter than it was.
- **The digest's own machinery is never captured.** Without that, an unreachable mail server logs
  an error, which is captured, which is mailed, which fails again, for as long as the outage lasts.

## Verifying it

**The middleware is unit tested.** It could not be under Azure Functions: the worker's binding
plumbing (`IFunctionBindingsFeature`) is `internal`, so nothing in a test project could drive an
invocation and see the response that came back, and whether a refusal carried its headers could
only be learned by starting a host and asking it over HTTP. `MiddlewarePipeline` now builds a real
ASP.NET Core pipeline per test with `Microsoft.AspNetCore.TestHost`, so all three middlewares run
for real against a real request.

The live probe, `Analytics.Tools verify`, is kept anyway, because a test pipeline is not the
deployed one. Six checks: the headers on a success, the same headers plus `Retry-After` on a 429, that a forged
`X-Forwarded-For` prefix buys no fresh allowance, that preflight reaches the middleware at all,
that an origin off the allowlist gets no permission, and that unsupported methods are refused.
It exits non-zero on any failure.

The probe has been checked against a deliberately broken host, by removing
`SecurityHeadersMiddleware` from the pipeline and confirming it reports the failure. That mattered:
the first version **threw** instead of reporting, because it asked `HttpContentHeaders.Contains`
for a name belonging to the response collection. While the headers were present the check
short-circuited before reaching it, so the fault only surfaced the one time it would have counted.

## Exceptions and logging

**Custom exceptions where a caller has to tell failures apart**, and the framework ones
everywhere else. `ArgumentOutOfRangeException` on a constructor guard is a programming error and
stays as it is; what earned its own type is a failure a caller acts on differently:

| Type | Why it is not a framework exception |
| --- | --- |
| `ConcurrencyException` | A lost ETag race is retried, not reported. The retry policy needs to recognise it. |
| `GeoDatabaseUnusableException` | The download is not a readable country database. Usually a bad month; retrying later is reasonable. |
| `GeoDatabaseTooLargeException` | The archive kept expanding past the ceiling. A security control, not a bad download, and retrying is the wrong response. It carries the limit that was passed. |
| `GeoDatabaseException` | The base of the two above, so one catch covers every way a refresh fails, and every one leaves the database already on disk untouched. |
| `DigestDeliveryException` | So the digest service catches a named failure rather than bare `Exception`, which would swallow a bug in the composing code along with a mail server being down. |

Both geo failures used to be `InvalidDataException`, thrown from two places with different
remedies, and the caller could not tell which it had caught.

**Logging is added where something chose a path silently**, not everywhere:

- `GeoResolverFactory` says which resolver it built. Without it, the only symptom of a missing
  database is every visitor resolving to an unknown country, which reads as a bug in the counter
  rather than a file nobody fetched.
- `TableProvisioner` says the table is ready. Failure is deliberately **not** caught: unreachable
  storage should stop the host, and it logs itself on the way out.
- `CorsMiddleware` warns when an origin off the allowlist is refused. This runs before the rate
  limiter, so its volume is uncapped; what bounds it is the digest sink, which drops and reports
  rather than growing.

**Not added, on purpose:**

- **Nothing in `Analytics.Domain`.** `ILogger` is a package, and the domain has none by design. A
  retry policy that wanted to narrate its attempts would have to break that, so it stays quiet and
  the caller reports what it threw.
- **`AzureCounterTable`.** It translates storage conflicts into `ConcurrencyException`, which the
  flush service already logs when it finally gives up. Logging here would double every line.

Two `Information` calls use source-generated `[LoggerMessage]` rather than the plain extension,
because `CA1873` asks for it on anything below `Warning` that takes an argument.

## What this does not stop

Stated plainly, because a list of controls reads like a guarantee otherwise.

- **Request bodies still arrive.** The endpoints read no body, and a 5 MB POST is accepted and
  ignored. Refusing it in the worker would not prevent the upload: the host has already buffered
  it by then, so a check there would be decoration. Kestrel's `MaxRequestBodySize` (30 MB by
  default) is the layer that can actually refuse one, and lowering it is a deploy-time setting.
- **Both limiter tiers are per instance.** The shared tier bounds one instance; scale out and the
  ceiling multiplies. Whatever bounds instance count on the chosen host bounds that multiplier,
  and a genuinely global quota
  would need shared state on every request, which would hand an attacker a storage transaction per
  request and make the problem worse.
- **CORS is not access control.** It decides whether a browser lets script read the reply, not
  whether the request arrives.
- **The counter is anonymous by design.** Anyone may call it. What stops it being inflated is
  the rate limiter and the fact that a wrong number costs nothing.
- **The GeoIP database has no checksum to verify against.** DB-IP publishes none. What is checked:
  the fetch is HTTPS-only, the archive is refused if it unpacks past 512 MB, and the unpacked file
  is opened as a country database and asked to resolve a known address **before** it replaces the
  one in place, so a bad file leaves the working one alone. The SHA-256 of what landed is printed
  so an unexpected change is visible. Beyond that the guarantee is DB-IP's TLS certificate.
- **`style-src` keeps `'unsafe-inline'`** on the site, and cannot lose it: Angular inlines 606
  `<style>` blocks across the prerendered pages and writes 756 style attributes from bindings, and
  it injects more at runtime for lazy chunks. Hashing is not available for either. What bounds it
  is that every channel injected CSS could exfiltrate through is already closed: `img-src 'self'
  data:`, `font-src 'self'`, `connect-src 'self'`, and `style-src` itself is `'self'` for URLs, so
  `background-image`, `@font-face` and `@import` all have nowhere to point.

Checked and found clean during the audit: no credentials in the repository or its history, no
vulnerable NuGet or runtime npm packages, row keys unaffected by hostile `X-Forwarded-For`
values (every one normalised to `ZZ`), no header injection through `Origin`, and unsupported
methods refused.

---

*This project has been co-authored by Claude Code.*
