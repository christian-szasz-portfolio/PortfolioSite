# The admin tool

A dashboard for the analytics, on this machine and nowhere else. It reads what the API stored,
keeps its own copy on disk, and draws it.

```
admin/Admin.Api/    the service: reads Azure, writes the archive, answers the dashboard
admin/adminapp/     the dashboard: one page, built into Admin.Api/wwwroot
admin.tests/        tests for the service
```

The dashboard follows the same layering as the landing page, stated as lint rules rather than as
convention: [`adminapp/README.md`](adminapp/README.md) has the table and the two rules particular
to this app.

## Two modes, and why they are two

The tool reads one storage account and archives what it finds. Which account that is decides what
every number on the page means, so it is a mode rather than a setting:

| | local | live |
| --- | --- | --- |
| started by | `dev/start-dev.cmd`, with the rest of the stack | `dev/start-admin-prod.cmd`, on its own |
| environment | `Development` | `Production` |
| reads | the Azurite emulator | the deployed storage account |
| archives to | `%LOCALAPPDATA%\analytics-admin-dev` | `%LOCALAPPDATA%\analytics-admin` |
| the figures are | seeded, clicked on localhost, made up | what the site actually collected |

**Two archives, not one.** The archive is the record: the API deletes a day at thirty, so anything
older exists there or nowhere. Local development produces junk figures by design, and writing
those into the record would make it worth less than the thirty days it exists to outlast.

**The page says which it is**, in a badge beside the title: `local · Azurite emulator` in grey,
`live · <account name>` in amber. Two runs of this tool are otherwise identical on screen, and the
only thing that differs is a connection string nobody can see. The account name is shown and the
key never is: naming the account says which storage without handing over the way in.

**Live mode needs a deployed storage account.** Until one is configured, `dev/start-admin-prod.cmd`
refuses, in words, and it refuses again if the connection string it is given turns out to name the
emulator. The second refusal is the one that matters, because `AdminOptions` defaults to Azurite:
without it a live run with nothing configured would come up wearing production's name, read a
laptop, and archive the result into the record.

## Local only, and enforced twice

The host binds to `127.0.0.1`, so nothing off this machine can reach it. `LoopbackOnlyMiddleware`
refuses anything that arrives from anywhere else regardless, because a bind address is one flag,
one environment variable or one reverse proxy away from being wrong, and what is behind it is a
connection string to the analytics storage and every figure the site has collected. A caller it
cannot place is refused rather than allowed: a control that fails open is not one.

There is no authentication, and that is the design rather than an omission. The only way to reach
it is to be sitting at this machine, and a password would only be a second thing to keep safe.

It never writes back. The stores it holds can read the analytics table and nothing in the tool
calls anything that changes it: a local tool that could edit the counter would make the counter
worth less. The two fakes in the tests throw if anything tries.

## What it keeps, and where

`%LOCALAPPDATA%\analytics-admin` for the live mode, `analytics-admin-dev` for the local one, or
wherever `Admin:DataRoot` says. One JSON file per day:

```
usage/2026-09-07.json     views, interactions, each operation and its count
views/2026-09-07.json     the counter's running total and its country breakdown
```

A file per day rather than one growing file: a sync rewrites only the days it fetched, a
half-written file damages one day rather than the history, and the folder can be read by anything,
which is the point of keeping it as files. Written to a temporary name and moved into place, so an
interrupted write leaves the previous day rather than a truncated one.

**This is the record, not a cache.** The API deletes a day once it is thirty days old, so anything
older exists here or nowhere. Nothing in the tool removes from the archive.

## The health panel

Everything else on the page comes off this machine's disk. This one asks the analytics API, Taskly
and Stack86 how they are, because heartbeats are what a running process knows about itself and
there is nowhere else to read them from.

- **It is pressed, never polled.** In production the API sleeps, and asking is what wakes it. The
  dashboard draws instantly without it and the panel says `Unknown` until you press `Check now`.
- **It reads the same payload the platform probes**, `/health/ready`, rather than an endpoint of
  its own. One source of truth, so the panel cannot say healthy while a probe says otherwise.
- **One stream, each service on its own.** Pressing the button opens `/api/admin/health/stream`,
  a server-sent event stream. The admin service asks all three at once and pushes each step as it
  happens: asking, waking once a service has been silent for five seconds, then its answer with
  the round trip, which is the cold start. A sleeping demo does not hold up the others, and a
  final `done` event lets the page close the stream before the browser would reopen it.
- **The wait outlasts a cold start.** `Admin:HealthTimeout` is 90 seconds by default; a sleeping
  container takes about 50 to answer its first request.
- **Unreachable is an answer.** A sleeping host, a wrong address or a timeout becomes a sentence
  in that panel; the rest of the page is untouched, because none of it needed the API.
- **`Admin__AnalyticsApiUrl`, `Admin__TasklyUrl` and `Admin__Stack86Url` say where to ask.**
  `dev/run-admin.cmd` points local mode at the analytics API on `http://localhost:5080` and leaves
  the demos unset, since both bind port 1998 locally. Live mode takes the API address from the
  environment and defaults the demos to their public addresses. An empty value leaves that row
  saying it has nothing to ask.

A worker that never started leaves no beat and no absence to notice, which is the one thing this
cannot see. The names are worth reading rather than only the colours.

## Syncing

The dashboard opens from disk: instant, no network, and it shows days the API deleted a year ago.
Pressing **Sync from Azure** is the only thing that reaches the network, and it is the only thing
that costs anything in storage transactions. Nothing polls: an archive that synced itself would
keep a laptop talking to Azure all day to learn that yesterday still happened.

A sync asks for the last `Admin:SyncDays` days, thirty by default, which is the whole window the
API keeps. Days with nothing in them are not written: the absence of a file is how the archive
says nobody came, which is different from a file full of zeroes.

## The other way out

`Analytics.Tools` still writes CSV, which is the better shape for a spreadsheet:

```bash
dotnet run --project analytics/Analytics.Tools -- export 30 usage.csv
```

The dashboard is for looking; the CSV is for anything the dashboard does not answer.

---

*This project has been co-authored by Claude Code.*
