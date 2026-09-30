/** Assembler: the desktop CPU simulator */

import { BlockKind, CalloutTone, CodeLanguage, Project, ProjectPage } from '../content.types';

export const assembler: Project = {
  slug: 'assembler',
  index: '03',
  title: 'Assembler',
  tagline: $localize`:@@work.assembler.tagline.text:A desktop CPU simulator that assembles a 47-instruction set and executes it one microcode step at a time, with the datapath drawn and lit as it goes.`,
  summary: $localize`:@@work.assembler.summary.text:A .NET MAUI app whose simulator core knows nothing about the screen. It reports what each microcode step touched, and the schematic decides how to light it.`,
  note: $localize`:@@work.assembler.note.text:Only the presenter may talk to more than one pane. That is what lets me test the state machine with no UI running.`,
  facts: [
    {
      key: $localize`:@@work.assembler.fact.1.label:Role`,
      value: $localize`:@@work.assembler.fact.1.value:Sole author, layered port of an educational simulator`,
    },
    {
      key: $localize`:@@work.assembler.fact.2.label:Shape`,
      value: $localize`:@@work.assembler.fact.2.value:Four projects, dependency arrow one way, domain depends on nothing`,
    },
    {
      key: $localize`:@@work.assembler.fact.3.label:Instruction set`,
      value: $localize`:@@work.assembler.fact.3.value:47 mnemonics in four encoding classes, four addressing modes`,
    },
    {
      key: $localize`:@@work.assembler.fact.4.label:Targets`,
      value: $localize`:@@work.assembler.fact.4.value:Windows and Mac Catalyst, English and Romanian`,
    },
    {
      key: $localize`:@@work.assembler.fact.5.label:Tests`,
      value: $localize`:@@work.assembler.fact.5.value:83 test methods over 80 data rows, in three test projects`,
    },
    {
      key: $localize`:@@work.assembler.fact.6.label:Gate`,
      value: $localize`:@@work.assembler.fact.6.value:StyleCop and .NET analyzers, warnings as errors`,
    },
    {
      key: $localize`:@@work.assembler.fact.7.label:Source`,
      value: $localize`:@@work.assembler.fact.7.value:Closed source`,
    },
  ],
  chips: ['.NET MAUI', 'C#', 'MVVM', 'MVP', 'CommunityToolkit.Mvvm', 'MSTest', 'StyleCop'],
  repository: null,
  repositoryNote: $localize`:@@work.assembler.repository.note:Closed source`,
  media: {
    label: $localize`:@@work.assembler.media.label:assembler · desktop simulator`,
    poster: 'assets/img/assembler-1280.jpg',
    clip: 'assets/clip/assembler.webm',
    alt: $localize`:@@work.assembler.media.alt:The Assembler desktop app: source editor, processor schematic with buses and registers, and stacked memory, machine code and microcode panes.`,
  },
  reversed: false,
  languages: ['C#', 'XAML'],
};

export const assemblerPage: ProjectPage = {
  slug: 'assembler',
  description: $localize`:@@work.assembler.page.text:Assembler in detail: four layers with the dependency arrow pointing one way, a pure simulator core publishing events over a channel, and a hand-drawn datapath that lights up as the microcode advances.`,
  articles: [
    {
      id: 'overview',
      heading: $localize`:@@work.assembler.overview.title:Overview`,
      lede: assembler.tagline,
      blocks: [
        {
          kind: BlockKind.Prose,
          text: $localize`:@@work.assembler.overview.usecase.text:A student writes ten lines of assembly, presses Step, and watches a value travel along the bus into a register.`,
        },
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.assembler.overview.item.1:Write or open assembly source in the editor`,
            $localize`:@@work.assembler.overview.item.3:Run, pause, step or reset, at a speed you choose`,
            $localize`:@@work.assembler.overview.item.4:See the active buses and registers light up on the processor schematic`,
          ],
        },
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.assembler.overview.callout.label:Engineering note`,
          text: assembler.note,
          tone: CalloutTone.Note,
        },
        { kind: BlockKind.Specs, rows: assembler.facts },
      ],
    },
    {
      id: 'architecture',
      heading: $localize`:@@work.assembler.architecture.title:Architecture`,
      lede: $localize`:@@work.assembler.architecture.text.1:Four layers, and a domain that could run from a console tomorrow.`,
      blocks: [
        {
          kind: BlockKind.Code,
          language: CodeLanguage.Text,
          caption: $localize`:@@work.assembler.architecture.caption.1:Dependency direction: Maui to Presentation to UseCases to Domain`,
          source: `src/
├── Assembler.Domain/        Pure CLR: ISA, assembler, microcode, simulator core
├── Assembler.UseCases/      Facades and fluent builders over the domain
├── Assembler.Presentation/  AppPresenter (MVP), AppStateMachine (FSM), view ports
└── Assembler.Maui/          .NET MAUI: one ViewModel per pane, drawn schematic, dialogs`,
        },
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.assembler.architecture.item.1:The domain uses no UI framework and starts no timers. Delay comes from an injected clock.`,
            $localize`:@@work.assembler.architecture.item.2:Every effect leaves the domain as a typed event over a channel.`,
            $localize`:@@work.assembler.architecture.item.3:I chose MVP over plain MVVM so one presenter holds the coordination, not every pane.`,
            $localize`:@@work.assembler.architecture.item.4:The only packages are MAUI and CommunityToolkit.Mvvm. The schematic is drawn by hand.`,
          ],
        },
      ],
    },
    {
      id: 'domain',
      heading: $localize`:@@work.assembler.domain.title:Domain design`,
      lede: $localize`:@@work.assembler.domain.text.1:An instruction set where the opcode is derived, not looked up.`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.assembler.domain.item.1:47 mnemonics in four encoding classes, four addressing modes, sixteen registers.`,
            $localize`:@@work.assembler.domain.item.2:Each instruction runs as a microcode program that names the exact bus it uses.`,
            $localize`:@@work.assembler.domain.item.3:The domain says "the S bus was activated", never "highlight this", so the drawing can change without touching the simulator.`,
          ],
        },
      ],
    },
    {
      id: 'flow',
      heading: $localize`:@@work.assembler.flow.title:Data and control flow`,
      lede: $localize`:@@work.assembler.flow.text.1:One press of Step, from the button to the lit bus.`,
      blocks: [
        {
          kind: BlockKind.List,
          ordered: true,
          items: [
            $localize`:@@work.assembler.flow.item.1:The presenter fires a trigger at the state machine. A rejected transition does nothing.`,
            $localize`:@@work.assembler.flow.item.2:The simulator fetches, decodes and runs one instruction's microcode.`,
            $localize`:@@work.assembler.flow.item.3:Each step publishes what it touched: bus, registers, flags.`,
            $localize`:@@work.assembler.flow.item.4:The presenter routes each event to the open panes, and the schematic redraws.`,
          ],
        },
        {
          kind: BlockKind.Callout,
          label: $localize`:@@work.assembler.flow.callout.label:Why a state machine drives it`,
          text: $localize`:@@work.assembler.flow.callout.text:A few booleans like isRunning and isPaused work until two of them are true at once. Named states make the impossible combinations impossible.`,
          tone: CalloutTone.Note,
        },
      ],
    },
    {
      id: 'testing',
      heading: $localize`:@@work.assembler.testing.title:Testing strategy`,
      lede: $localize`:@@work.assembler.testing.text.1:Three test projects below the UI, and none above the presenter.`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.assembler.testing.item.1:A golden-encoding suite pins the exact machine code each instruction assembles to.`,
            $localize`:@@work.assembler.testing.item.2:The state machine is tested exhaustively: 42 rows, every accepted and rejected transition.`,
            $localize`:@@work.assembler.testing.item.3:The injected clock lets a twenty-second run finish in microseconds under test.`,
            $localize`:@@work.assembler.testing.item.4:StyleCop and .NET analyzers with warnings as errors. An undocumented member fails the build.`,
          ],
        },
      ],
    },
    {
      id: 'changes',
      heading: $localize`:@@work.assembler.changes.title:What I would change`,
      blocks: [
        {
          kind: BlockKind.List,
          items: [
            $localize`:@@work.assembler.changes.item.1:The schematic keeps its own light palette while every other pane is dark. It should read the theme.`,
            $localize`:@@work.assembler.changes.item.3:Nothing above the presenter is tested. An automation-driven smoke test is the realistic next gate.`,
            $localize`:@@work.assembler.changes.item.4:The state machine has no entry or exit actions: fine at nine states, not at thirty.`,
            $localize`:@@work.assembler.changes.item.5:The microcode catalogue is built in. Loading one from a file would help students most.`,
          ],
        },
      ],
    },
  ],
};
