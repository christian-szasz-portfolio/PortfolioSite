import { Cv, CvContactIcon } from './cv.types';

/** The CV, from which both the pop-up and the /cv page are drawn */
export const cv: Cv = {
  documentTitle: $localize`:@@cv.document.title:Christian-Ioan Szasz - Full-Stack Software Engineer`,
  description: $localize`:@@cv.description.text:Full-Stack Software Engineer with 4+ years of experience building cloud SaaS accounting products on .NET, Angular, React and Microsoft Azure.`,

  profile: {
    name: 'Christian-Ioan Szasz',
    title: [$localize`:@@cv.title.1:Full-Stack`, $localize`:@@cv.title.2:Software Engineer`],
    subtitle: '.NET · Angular · React · Azure',
    photo: 'assets/img/cv-photo.jpg',
    photoAlt: 'Christian-Ioan Szasz',
  },

  contact: [
    {
      icon: CvContactIcon.Phone,
      label: $localize`:@@cv.phone.label:Phone`,
      text: '+40 773 756 697',
    },
    {
      icon: CvContactIcon.Email,
      label: $localize`:@@cv.email.label:Email`,
      text: 'christian.ioan.szasz@gmail.com',
    },
    {
      icon: CvContactIcon.Location,
      label: $localize`:@@cv.location.label:Location`,
      text: $localize`:@@cv.city.value:Sibiu, Romania`,
    },
    {
      icon: CvContactIcon.Website,
      label: $localize`:@@cv.website.label:Website`,
      text: 'christianszasz.dev',
    },
    {
      icon: CvContactIcon.Linkedin,
      label: $localize`:@@cv.linkedin.label:LinkedIn`,
      text: '/christian-szasz',
    },
    {
      icon: CvContactIcon.Github,
      label: $localize`:@@cv.github.label:GitHub`,
      text: '/christian-szasz-portfolio',
    },
  ],

  // Product names and versions, so only the measures and the one prose entry are translated
  skills: [
    { name: 'C# / .NET (Fw 4.8, 6 → 10)', measure: $localize`:@@cv.years4.value:4 years` },
    { name: 'Angular (13 → 20) / TypeScript', measure: $localize`:@@cv.years4.value:4 years` },
    { name: 'Azure · Service Bus · Blob', measure: $localize`:@@cv.years4.value:4 years` },
    { name: 'Rebus · Sagas · CQRS', measure: $localize`:@@cv.years4.value:4 years` },
    { name: 'SQL Server (sharded)', measure: $localize`:@@cv.years4.value:4 years` },
    { name: 'Git · GitHub Actions', measure: $localize`:@@cv.years4.value:4 years` },
    { name: 'MSTest · Moq · Playwright', measure: $localize`:@@cv.years4.value:4 years` },
    { name: 'React 19', measure: $localize`:@@cv.year1.value:1 year` },
    {
      name: $localize`:@@cv.skillAi.label:AI-assisted development`,
      measure: $localize`:@@cv.years2.value:2 years`,
    },
  ],

  education: [
    {
      school: $localize`:@@cv.university.value:Lucian Blaga University of Sibiu`,
      degree: [
        $localize`:@@cv.msc.text.1:Master’s Degree in`,
        $localize`:@@cv.msc.text.2:Embedded Systems`,
      ],
      meta: 'Sibiu 2021 – 2023',
    },
    {
      school: $localize`:@@cv.university.value:Lucian Blaga University of Sibiu`,
      degree: [
        $localize`:@@cv.bsc.text.1:Bachelor of Information and`,
        $localize`:@@cv.bsc.text.2:Communication Technologies`,
      ],
      meta: 'Sibiu 2017 – 2021',
    },
  ],

  languages: [
    {
      name: $localize`:@@cv.romanian.label:Romanian`,
      measure: $localize`:@@cv.native.value:Native`,
    },
    {
      name: $localize`:@@cv.german.label:German`,
      measure: $localize`:@@cv.native.value:Native`,
    },
    { name: $localize`:@@cv.english.label:English`, measure: 'C1' },
  ],

  about: [
    [
      { text: $localize`:@@cv.about.text.1:I am a ` },
      { text: $localize`:@@cv.about.text.2:Full-Stack Software Engineer`, strong: true },
      { text: $localize`:@@cv.about.text.3: with ` },
      { text: $localize`:@@cv.about.text.4:4+ years of experience`, strong: true },
      {
        text: $localize`:@@cv.about.text.5: building cloud SaaS accounting products for the Nordic and Dutch markets on .NET, Angular, React and Microsoft Azure.`,
      },
    ],
    [
      {
        text: $localize`:@@cv.about.text.6:I work across the whole stack, from Rebus sagas and CQRS over Azure Service Bus and sharded SQL Server to Angular and React frontends, and ship every change behind a feature flag with automated tests. Clean architecture and `,
      },
      { text: $localize`:@@cv.about.text.7:AI-assisted development`, strong: true },
      {
        text: $localize`:@@cv.about.text.8: with Claude Code, GitHub Copilot and MCP agents let me move fast without losing quality.`,
      },
    ],
  ],

  roles: [
    {
      title: $localize`:@@cv.role.1.title:Software Developer`,
      period: '2025 – 2026',
      project: $localize`:@@cv.role.1.project.title:SaaS Accounting Suite for Small Businesses · Visma Software`,
      context: $localize`:@@cv.role.1.context.text:A .NET Framework 4.8 monolith with a jQuery and Knockout.js frontend on multi-tenant SQL Server, serving small businesses in Sweden, Norway and the Netherlands, modernised incrementally towards .NET 8 and React 19 behind feature flags.`,
      achievements: [
        {
          lead: $localize`:@@cv.role.1.achievement.1.lead:Increased customer feedback coverage by an estimated 80% to help product management hit strategic roadmap milestones`,
          rest: $localize`:@@cv.role.1.achievement.1.rest: by replacing the legacy customer feedback tool with Survicate and automating Survicate feedback into Slack through n8n workflows.`,
        },
        {
          lead: $localize`:@@cv.role.1.achievement.2.lead:Contributed to backend data-integrity and reliability work`,
          rest: $localize`:@@cv.role.1.achievement.2.rest: across the monolith and its Azure Functions background jobs, from streaming large data exports to hardening endpoints against stale sessions and XSS.`,
        },
        {
          lead: $localize`:@@cv.role.1.achievement.3.lead:Contributed to the incremental migration from .NET Framework 4.8 to .NET 8 and Knockout.js to React 19`,
          rest: $localize`:@@cv.role.1.achievement.3.rest:, building redesigned sales pages in React 19 with Playwright GUI coverage and adding Snowplow customer-journey tracking.`,
        },
      ],
      points: [
        $localize`:@@cv.role.1.point.item.1:Extended the public REST API, wrote production data-fix SQL scripts and built Claude Code skills and MCP agents for investigation, review and PRs.`,
      ],
      skills: $localize`:@@cv.role.1.skills.text:Skills: .NET 8, .NET Framework 4.8, React 19, TypeScript, Azure Functions, Playwright`,
    },
    {
      title: $localize`:@@cv.role.2.title:Software Developer`,
      period: '2022 – 2025',
      project: $localize`:@@cv.role.2.project.title:Accounting-Office Microservices Platform · Visma Software`,
      context: $localize`:@@cv.role.2.context.text:A cloud platform for accounting offices built as four .NET and Angular microservices that communicate over Azure Service Bus with Rebus sagas and CQRS, each with its own multi-tenant SQL Server data.`,
      achievements: [
        {
          lead: $localize`:@@cv.role.2.achievement.1.lead:Contributed to cutting failed cross-service deletions by an estimated 90% to keep distributed data consistent at scale`,
          rest: $localize`:@@cv.role.2.achievement.1.rest: by serialising the scheduled deletion sagas and moving recurring background schedulers to Rebus message handlers, with internal admin operations to retry and monitor them.`,
        },
        {
          lead: $localize`:@@cv.role.2.achievement.2.lead:Implemented a cold-data strategy`,
          rest: $localize`:@@cv.role.2.achievement.2.rest: in which infrequently accessed historical records are archived from SQL Server to compressed JSON in Azure Blob Storage and rehydrated on demand, including company import and export.`,
        },
        {
          lead: $localize`:@@cv.role.2.achievement.3.lead:Implemented the Swedish SIE1 accounting format as a new import source`,
          rest: $localize`:@@cv.role.2.achievement.3.rest: across three services, extending the shared SIE parser library with SIE1 validation and adapting the import saga, balances, closing entries and onboarding flow.`,
        },
      ],
      points: [
        $localize`:@@cv.role.2.point.item.1:Migrated an Angular frontend (60+ components) to the in-house design system and helped automate translations with Crowdin and GitHub Actions.`,
      ],
      skills: $localize`:@@cv.role.2.skills.text:Skills: .NET, Angular, Rebus, Saga, CQRS, Azure Service Bus, GitHub Actions`,
    },
    {
      title: $localize`:@@cv.role.3.title:System Administrator`,
      period: '2021 – 2022',
      project: $localize`:@@cv.role.3.project.title:Infrastructure Monitoring · Visma Software`,
      points: [
        $localize`:@@cv.role.3.point.item.1:Automated recurring Active Directory reporting with a PowerShell and .NET Windows Forms tool for data extraction and record processing.`,
        $localize`:@@cv.role.3.point.item.2:Ran 24/7 L1/L2 monitoring of servers, databases and backups (SCOM, Icinga2, Opsgenie); provisioning, patching and releases via vSphere, SCCM and Jenkins.`,
      ],
      skills: $localize`:@@cv.role.3.skills.text:Skills: PowerShell, .NET, SCOM, ServiceNow, Opsgenie, Jenkins, VMware vSphere`,
    },
  ],

  pageNumber: '1/1',
};
