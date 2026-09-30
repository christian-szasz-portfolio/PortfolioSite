/** Taskly: the project and task management product */

import { BlockKind, CalloutTone, Project, ProjectPage } from '../content.types';
import { diagram } from './diagrams';

export const taskly: Project = {
  slug: 'taskly',
  index: '02',
  title: 'Taskly',
  tagline: $localize`:@@work.taskly.tagline.text:Project and issue tracking with a Kanban board, epics, time tracking, reporting and real-time notifications, on .NET 10 and Angular 22.`,
  summary: $localize`:@@work.taskly.summary.text:A CQRS backend where controllers only dispatch, a domain that refuses silent overwrites, and a board that updates live over SignalR.`,
  note: $localize`:@@work.taskly.note.text:Deletion is a state, not an event. Every entity is soft-deleted, so "who removed this and when" is a query, not a restore from backup.`,
  facts: [
    {
      key: $localize`:@@work.taskly.fact.1.label:Role`,
      value: $localize`:@@work.taskly.fact.1.value:Sole author, backend, frontend, infrastructure and tooling`,
    },
    {
      key: $localize`:@@work.taskly.fact.2.label:Shape`,
      value: $localize`:@@work.taskly.fact.2.value:Twelve .NET projects, an Angular 22 client, an admin app and a deploy CLI`,
    },
    {
      key: $localize`:@@work.taskly.fact.3.label:Data`,
      value: $localize`:@@work.taskly.fact.3.value:EF Core on SQL Server, soft delete, row-version concurrency`,
    },
    {
      key: $localize`:@@work.taskly.fact.4.label:Real time`,
      value: $localize`:@@work.taskly.fact.4.value:SignalR, with per-user groups and eight background workers`,
    },
    {
      key: $localize`:@@work.taskly.fact.5.label:Tests`,
      value: $localize`:@@work.taskly.fact.5.value:3,666 backend test methods across 13 projects, 2,241 frontend specs`,
    },
    {
      key: $localize`:@@work.taskly.fact.6.label:Public repository`,
      value: $localize`:@@work.taskly.fact.6.value:A demo variant: no sign-in, localStorage in place of the API`,
    },
  ],
  chips: ['.NET 10', 'Angular 22', 'CQRS', 'EF Core', 'OpenIddict', 'SignalR', 'Aspire', 'Vitest'],
  repository: 'https://github.com/christian-szasz-portfolio/Taskly',
  demo: 'https://taskly.christianszasz.dev',
  demoVariant: true,
  media: {
    label: $localize`:@@work.taskly.media.label:taskly · board & time tracking`,
    poster: 'assets/img/taskly-1280.jpg',
    clip: 'assets/clip/taskly.webm',
    alt: $localize`:@@work.taskly.media.alt:The Taskly Kanban board in dark mode: task cards spread across the Open, To-Do, In Progress, Testing and Done columns.`,
  },
  reversed: true,
  languages: ['C#', 'TypeScript'],
};

export const tasklyPage: ProjectPage = {
  slug: 'taskly',
  description: $localize`:@@work.taskly.page.text:Taskly in detail: a CQRS backend over EF Core with soft delete and optimistic concurrency, OpenIddict authentication, SignalR notifications, and an Angular 22 client on signal stores.`,
  articles: [
    {
      id: 'overview',
      heading: $localize`:@@work.taskly.overview.title:Overview`,
      lede: taskly.tagline,
      blocks: [
        {
          kind: BlockKind.Prose,
          text: $localize`:@@work.taskly.overview.usecase.text:Someone triages the overnight cards, moves three onto the board and starts a timer. Everything underneath exists so two people editing the same task never silently lose an edit.`,
        },
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.taskly.overview.item.2:Issues with priority, status, labels, epics and a position on the board`,
            $localize`:@@work.taskly.overview.item.3:Board, backlog, epic and resolved views for every project`,
            $localize`:@@work.taskly.overview.item.6:Time tracking, a calendar and reporting charts`,
            $localize`:@@work.taskly.overview.item.7:Live notifications, deadline reminders and a weekly digest`,
          ],
        },
        diagram(
          'taskly/use-cases',
          1280,
          990,
          $localize`:@@work.taskly.figure.usecases.alt:Use case diagram: a visitor registers and logs in; a user manages projects, issues and time, and sees teammates’ moves live; an administrator operates the admin app; background services send reminders and digests and expire trials.`,
          $localize`:@@work.taskly.figure.usecases.caption:Four actors, grouped by the job they come to do.`,
        ),
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.taskly.overview.live.label:Try it`,
          text: $localize`:@@work.taskly.overview.live.text:The public demo runs the same client without sign-in. Your data stays in your browser.`,
          tone: CalloutTone.Aside,
        },
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.taskly.overview.callout.label:Engineering note`,
          text: taskly.note,
          tone: CalloutTone.Note,
        },
        { kind: BlockKind.Specs, rows: taskly.facts },
      ],
    },
    {
      id: 'architecture',
      heading: $localize`:@@work.taskly.architecture.title:Architecture`,
      lede: $localize`:@@work.taskly.architecture.text.1:Six layers, one direction, and controllers that only dispatch.`,
      blocks: [
        diagram(
          'taskly/architecture',
          1280,
          740,
          $localize`:@@work.taskly.figure.architecture.alt:Architecture diagram: the browser calls Taskly.Web over HTTPS and gets notifications over SignalR; Web, Api, Logic and Data depend strictly downward onto SQL Server; Common and Contracts are shared; a separate admin app calls the API over HTTP.`,
          $localize`:@@work.taskly.figure.architecture.caption:Every arrow points down; the admin app is a client of the API, not a back door.`,
        ),
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.taskly.architecture.item.1:A project may only reference the layer below it, so any handler can be tested against a fake.`,
            $localize`:@@work.taskly.architecture.item.2:A controller builds a command or a query and dispatches it. Permissions come from attributes, not from checks inside handlers.`,
            $localize`:@@work.taskly.architecture.item.3:The Angular client is standalone components on signal stores, one per domain slice, rendered on the server.`,
            $localize`:@@work.taskly.architecture.item.4:I wrote the CQRS layer, the Result type and a small mapper myself: cheaper to own than to configure.`,
          ],
        },
      ],
    },
    {
      id: 'domain',
      heading: $localize`:@@work.taskly.domain.title:Domain design`,
      lede: $localize`:@@work.taskly.domain.text.1:Two aggregates, and two rules the database enforces instead of convention.`,
      blocks: [
        diagram(
          'taskly/erd',
          1280,
          1000,
          $localize`:@@work.taskly.figure.erd.alt:Entity relationship diagram: projects have contributors and task items, task items have subtasks, and comments, time entries and attachments belong to a task item or a subtask; notifications, system tasks and deletion logs reference rows by id only.`,
          $localize`:@@work.taskly.figure.erd.caption:The tables behind the board. SD marks soft delete, RV a row version.`,
        ),
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.taskly.domain.item.1:Project and TaskItem are the aggregate roots. Handlers load and save only those.`,
            $localize`:@@work.taskly.domain.item.2:Each save carries the row version the client read, so an edit made against a stale copy is refused with a 409.`,
            $localize`:@@work.taskly.domain.item.3:A global query filter makes delete a flag. Hard delete is for administrators only.`,
            $localize`:@@work.taskly.domain.item.4:One specification per entity keeps queries out of the handlers.`,
          ],
        },
      ],
    },
    {
      id: 'flow',
      heading: $localize`:@@work.taskly.flow.title:Data and control flow`,
      lede: $localize`:@@work.taskly.flow.text.1:One card moved on the board, followed to the other browser that sees it.`,
      blocks: [
        diagram(
          'taskly/card-move',
          1280,
          840,
          $localize`:@@work.taskly.figure.cardmove.alt:Sequence diagram: the board moves the card at once and sends a transition with the row version it read; the handler loads the card, applies the rules and saves only if that version still matches, then tells every contributor’s board over SignalR, and the other board reloads; if someone saved first, the API answers 409 and the board reloads to show their version.`,
          $localize`:@@work.taskly.figure.cardmove.caption:Checked against what the mover saw, then shown to everyone with the board open.`,
        ),
        {
          kind: BlockKind.Prose,
          text: $localize`:@@work.taskly.flow.text.2:A board column loads every card and subtask in one batch request, not one per card. Eight background services dispatch the same commands controllers do, so a trial ends without anyone clicking anything.`,
        },
      ],
    },
    {
      id: 'testing',
      heading: $localize`:@@work.taskly.testing.title:Testing strategy`,
      lede: $localize`:@@work.taskly.testing.text.1:3,666 backend test methods and 2,241 frontend specs, with the handler as the unit.`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.taskly.testing.item.1:A handler is tested with a fake repository and a principal, and asserted through its Result.`,
            $localize`:@@work.taskly.testing.item.2:Routing, auth or the database make it an integration test by definition.`,
          ],
        },
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.taskly.testing.callout.label:What this got wrong`,
          text: $localize`:@@work.taskly.testing.callout.text:CI ran lint, build and unit tests, but no end-to-end stage. Twenty-nine Playwright tests sat red for weeks. A gate that does not run is not a gate.`,
          tone: CalloutTone.Warning,
        },
      ],
    },
    {
      id: 'changes',
      heading: $localize`:@@work.taskly.changes.title:What I would change`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.taskly.changes.item.1:Tasks and workflows share their shapes but diverged in code. One generic feature would remove about a thousand lines.`,
            $localize`:@@work.taskly.changes.item.2:The reflective mapper was right at ten DTOs and is wrong at fifty: slower, and a rename only fails at runtime.`,
            $localize`:@@work.taskly.changes.item.6:Subtasks do not send their row version or broadcast their moves yet. The task path is the template to copy.`,
            $localize`:@@work.taskly.changes.item.7:A reorder writes one UPDATE per card inside a transaction. A single CASE statement would make it one round trip.`,
            $localize`:@@work.taskly.changes.item.4:Permissions live in the API and are mirrored in the client. Sending them with the session would remove the drift.`,
          ],
        },
      ],
    },
  ],
};
