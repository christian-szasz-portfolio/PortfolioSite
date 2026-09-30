/** Stack86: the compiler and emulator */

import { BlockKind, CalloutTone, Project, ProjectPage } from '../content.types';
import { diagram } from './diagrams';

export const stack86: Project = {
  slug: 'stack86',
  index: '01',
  title: 'Stack86',
  tagline: $localize`:@@work.stack86.tagline.text:A browser IDE that compiles nine languages down to 8086 assembly, then runs the result on an emulator you can single-step.`,
  summary: $localize`:@@work.stack86.summary.text:Compilation runs on the server, where each language is checked by its own toolchain. Execution runs in your browser, one instruction at a time, with registers, flags, stack and memory on screen.`,
  note: $localize`:@@work.stack86.note.text:Seven front ends lower to the same three-address code, and C++ and TypeScript are transpiled into two of them. A new language needs a parser, not another code generator.`,
  facts: [
    {
      key: $localize`:@@work.stack86.fact.1.label:Role`,
      value: $localize`:@@work.stack86.fact.1.value:Sole author, backend, frontend and toolchain`,
    },
    {
      key: $localize`:@@work.stack86.fact.2.label:Shape`,
      value: $localize`:@@work.stack86.fact.2.value:ASP.NET Core modular monolith plus an Angular 22 SPA`,
    },
    {
      key: $localize`:@@work.stack86.fact.3.label:Languages in`,
      value: $localize`:@@work.stack86.fact.3.value:C, C++, C#, Go, Java, JavaScript, Python, Rust, TypeScript`,
    },
    {
      key: $localize`:@@work.stack86.fact.4.label:Target`,
      value: $localize`:@@work.stack86.fact.4.value:8086 assembly, executed by a browser emulator`,
    },
    {
      key: $localize`:@@work.stack86.fact.5.label:Tests`,
      value: $localize`:@@work.stack86.fact.5.value:956 backend test methods, 864 frontend specs, 100 end to end`,
    },
    {
      key: $localize`:@@work.stack86.fact.6.label:Public repository`,
      value: $localize`:@@work.stack86.fact.6.value:A reduced variant: sign-in and persistence removed`,
    },
  ],
  chips: ['.NET 10', 'Angular 22', 'CQRS', 'NgRx', 'Monaco', 'EF Core', 'Polly', 'Vite'],
  repository: 'https://github.com/christian-szasz-portfolio/Stack86',
  demo: 'https://stack86.christianszasz.dev',
  demoVariant: true,
  media: {
    label: $localize`:@@work.stack86.media.label:stack86 · compiler & emulator`,
    poster: 'assets/img/stack86-1280.jpg',
    clip: 'assets/clip/stack86.webm',
    alt: $localize`:@@work.stack86.media.alt:The Stack86 IDE: C source on the left, the generated 8086 assembly on the right, and a build log reporting the pipeline.`,
  },
  reversed: false,
  languages: ['C#', 'TypeScript', '8086 assembly'],
};

export const stack86Page: ProjectPage = {
  slug: 'stack86',
  description: $localize`:@@work.stack86.page.text:Stack86 in detail: nine languages lowered through seven front ends to one intermediate representation, a CQRS compilation pipeline, and an 8086 emulator that runs in the browser.`,
  articles: [
    {
      id: 'overview',
      heading: $localize`:@@work.stack86.overview.title:Overview`,
      lede: stack86.tagline,
      blocks: [
        {
          kind: BlockKind.Prose,
          text: $localize`:@@work.stack86.overview.usecase.text:You have written a for loop ten thousand times. Stack86 shows you what the machine actually does with it.`,
        },
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.stack86.overview.item.1:Write in C, C++, C#, Go, Java, JavaScript, Python, Rust or TypeScript`,
            $localize`:@@work.stack86.overview.item.3:Read the 8086 assembly it compiles to`,
            $localize`:@@work.stack86.overview.item.4:Step through it and watch registers, flags, stack and memory change`,
          ],
        },
        diagram(
          'stack86/use-cases',
          1280,
          990,
          $localize`:@@work.stack86.figure.usecases.alt:Use case diagram: a visitor signs up and signs in with two-factor authentication; a user writes code in one of nine languages, compiles it with a live build log and steps through the result in the emulator; the languages' own toolchains check every build.`,
          $localize`:@@work.stack86.figure.usecases.caption:A trial licence compiles C; a full licence compiles all nine languages.`,
        ),
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.stack86.overview.live.label:Try it`,
          text: $localize`:@@work.stack86.overview.live.text:The public instance runs the full compiler. Sign-in and saving are switched off, so nothing you write is kept.`,
          tone: CalloutTone.Aside,
        },
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.stack86.overview.callout.label:Engineering note`,
          text: stack86.note,
          tone: CalloutTone.Note,
        },
        { kind: BlockKind.Specs, rows: stack86.facts },
      ],
    },
    {
      id: 'architecture',
      heading: $localize`:@@work.stack86.architecture.title:Architecture`,
      lede: $localize`:@@work.stack86.architecture.text.1:A modular monolith with one dependency direction and one deliberate process boundary.`,
      blocks: [
        diagram(
          'stack86/architecture',
          1280,
          740,
          $localize`:@@work.stack86.figure.architecture.alt:Architecture diagram: the Angular client calls Stack86.Web over HTTPS and receives the build as NDJSON; Web, Api, Logic and Data depend downward onto SQL Server, which holds identity only; Logic calls the external toolchains through Polly; the 8086 emulator runs in the browser.`,
          $localize`:@@work.stack86.figure.architecture.caption:The dashed line is the process boundary: compile on the server, execute in the browser.`,
        ),
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.stack86.architecture.item.1:Compilation stays on the server, where each language is checked by its own toolchain: TCC, javac, rustc, gofmt, Node, Python.`,
            $localize`:@@work.stack86.architecture.item.2:Execution stays in the browser, because a held-down Step button cannot wait for the network.`,
            $localize`:@@work.stack86.architecture.item.3:Every stage is a filter, and each language takes its chain from one registry, so the whole back half is shared.`,
            $localize`:@@work.stack86.architecture.item.4:I wrote the CQRS layer instead of taking MediatR: two interfaces and a dispatcher were all it needed.`,
          ],
        },
      ],
    },
    {
      id: 'domain',
      heading: $localize`:@@work.stack86.domain.title:Domain design`,
      lede: $localize`:@@work.stack86.domain.text.1:One small intermediate representation that every language has to fit into.`,
      blocks: [
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.stack86.domain.ddd.label:Not a DDD domain, on purpose`,
          text: $localize`:@@work.stack86.domain.ddd.text:A compiler is a pure function from source to assembly, with no state that outlives a request. The shared vocabulary here is the IR, not an aggregate.`,
          tone: CalloutTone.Aside,
        },
        diagram(
          'stack86/pipeline',
          1280,
          760,
          $localize`:@@work.stack86.figure.pipeline.alt:Pipeline diagram: nine languages pass their own checks; C++ is transpiled to C and TypeScript to JavaScript; seven front ends lower everything to one intermediate representation, which is optimised, validated against the 8086 limits and emitted as 8086 assembly.`,
          $localize`:@@work.stack86.figure.pipeline.caption:Nine languages in, one IR in the middle, one 8086 back end out.`,
        ),
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.stack86.domain.item.1:Front ends know nothing about the 8086. They produce IR and diagnostics, nothing else.`,
            $localize`:@@work.stack86.domain.item.2:Registers, segments and INT 21h live only behind the code generator.`,
            $localize`:@@work.stack86.domain.item.3:Wiring a language in is one registry entry, not a special case.`,
          ],
        },
      ],
    },
    {
      id: 'flow',
      heading: $localize`:@@work.stack86.flow.title:Data and control flow`,
      lede: $localize`:@@work.stack86.flow.text.1:One build, from the keystroke to the stepping emulator.`,
      blocks: [
        diagram(
          'stack86/build',
          1280,
          800,
          $localize`:@@work.stack86.figure.build.alt:Sequence diagram: the workbench posts the files; licence, scope, rate limit and the trial rule are checked; the pipeline streams build log lines as NDJSON while each toolchain check runs behind a circuit breaker, a retry and a timeout; the assembly arrives last and the emulator steps it locally; if a toolchain keeps failing, the circuit opens and the build fails fast.`,
          $localize`:@@work.stack86.figure.build.caption:The log moves while the stages run; after that, every step is a local function call.`,
        ),
      ],
    },
    {
      id: 'testing',
      heading: $localize`:@@work.stack86.testing.title:Testing strategy`,
      lede: $localize`:@@work.stack86.testing.text.1:956 backend tests, 864 frontend specs, 100 end to end, and a build that fails on any warning.`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.stack86.testing.item.1:A pipeline stage or a front end is a unit test. Routing, auth or the database make it an integration test.`,
            $localize`:@@work.stack86.testing.item.2:Green tests did not catch the editor collapsing to five pixels, so I keep Playwright screenshots next to them.`,
            $localize`:@@work.stack86.testing.item.3:StyleCop and ESLint with warnings as errors, and no escape hatch to any in either language.`,
          ],
        },
      ],
    },
    {
      id: 'changes',
      heading: $localize`:@@work.stack86.changes.title:What I would change`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.stack86.changes.item.1:No register allocator yet: every value gets a stack slot, so the assembly is two to three times longer than it needs to be.`,
            $localize`:@@work.stack86.changes.item.2:The optimiser is a single copy-propagation pass. Constant folding and dead-store elimination are still missing.`,
            $localize`:@@work.stack86.changes.item.4:A toolchain missing on the server looks like a compiler bug, not a missing dependency.`,
            $localize`:@@work.stack86.changes.item.5:The languages are not equally deep, and the language picker should say so.`,
          ],
        },
      ],
    },
  ],
};
