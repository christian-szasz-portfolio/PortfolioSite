import { test as base, expect, type Locator, type Page, type Route } from '@playwright/test';

import { ConsentChoice, Lang, StorageKey, apiOrigin, localeOf } from './site';

/** How the stubbed API answers */
export enum ApiMode {
  Ok = 'ok',
  /** A 5xx, which the site reports as the backend being down */
  Failing = 'failing',
  /** A 429, which is throttling and never reported */
  Throttled = 'throttled',
  /** No answer at all */
  Offline = 'offline',
}

export interface ApiCall {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
}

export interface InteractionEvent {
  readonly kind: string;
  readonly target?: string;
}

export interface ViewStats {
  readonly total: number;
  readonly countries: readonly { readonly code: string; readonly count: number }[];
}

export const sampleStats: ViewStats = {
  total: 1234,
  countries: [
    { code: 'RO', count: 900 },
    { code: 'DE', count: 300 },
    { code: 'ZZ', count: 34 },
  ],
};

/** What the API's CORS answers a preflight with */
const preflight = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Lets the calling page read the answer, as the API does for the site's own origin */
function allowed(headers: Record<string, string>): Record<string, string> {
  return { 'Access-Control-Allow-Origin': headers['origin'] ?? '*', Vary: 'Origin' };
}

/** Stands in for the counter API and remembers what the page asked it */
export class ApiStub {
  public readonly calls: ApiCall[] = [];
  public mode: ApiMode = ApiMode.Ok;
  /** Interactions can fail on their own, with views still answering */
  public interactionsMode: ApiMode | null = null;
  public stats: ViewStats = sampleStats;

  public async attach(page: Page): Promise<void> {
    await page.route('**/api/**', (route) => this.answer(route));
  }

  public views(method?: string): ApiCall[] {
    return this.calls.filter(
      (call) => call.path === '/api/views' && (method === undefined || call.method === method),
    );
  }

  /** Every event the page has reported, across batches */
  public events(): InteractionEvent[] {
    return this.calls
      .filter((call) => call.path === '/api/interactions')
      .flatMap((call) => (call.body as { events: InteractionEvent[] }).events);
  }

  private async answer(route: Route): Promise<void> {
    const request = route.request();

    // The API is on its own origin, so the browser asks first; answered as the API's CORS does
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: { ...allowed(request.headers()), ...preflight },
      });
      return;
    }

    const cors = allowed(request.headers());
    const path = new URL(request.url()).pathname;
    const text = request.postData();
    this.calls.push({
      method: request.method(),
      path,
      body: text === null ? null : (JSON.parse(text) as unknown),
    });

    const mode = path === '/api/interactions' ? (this.interactionsMode ?? this.mode) : this.mode;

    switch (mode) {
      case ApiMode.Offline:
        await route.abort('internetdisconnected');
        return;
      case ApiMode.Failing:
        await route.fulfill({ status: 503, headers: cors, body: 'down' });
        return;
      case ApiMode.Throttled:
        await route.fulfill({
          status: 429,
          headers: { ...cors, 'Retry-After': '30', 'Access-Control-Expose-Headers': 'Retry-After' },
          body: '',
        });
        return;
      case ApiMode.Ok:
        break;
    }

    if (path === '/api/views') {
      await route.fulfill({ headers: cors, json: this.stats });
    } else {
      const events = (this.calls.at(-1)?.body as { events?: unknown[] } | null)?.events ?? [];
      await route.fulfill({
        status: 202,
        headers: cors,
        json: { accepted: events.length, rejected: 0 },
      });
    }
  }
}

interface Options {
  /** The consent choice stored before the page loads */
  consent: ConsentChoice;
  /** Console errors a test expects, matched by text; one pattern, as an array would read as options */
  tolerate: RegExp | null;
}

interface Fixtures {
  api: ApiStub;
  /** Fails the test on a console error, an uncaught exception or a request that leaves the site */
  guard: void;
}

export const test = base.extend<Options & Fixtures>({
  consent: [ConsentChoice.Denied, { option: true }],
  tolerate: [null, { option: true }],

  api: [
    async ({ page, consent }, use) => {
      const stub = new ApiStub();
      await stub.attach(page);

      if (consent !== ConsentChoice.Unset) {
        await page.addInitScript(
          ([key, value]) => {
            // Only the first load of a test is seeded, so a choice made later survives a reload
            if (sessionStorage.getItem('e2e-seeded') === null) {
              localStorage.setItem(key, value);
              sessionStorage.setItem('e2e-seeded', '1');
            }
          },
          [StorageKey.Consent, consent] as const,
        );
      }

      await use(stub);
    },
    { auto: true },
  ],

  guard: [
    async ({ page, tolerate, baseURL }, use) => {
      const problems: string[] = [];
      const origin = new URL(baseURL ?? 'http://127.0.0.1').origin;
      const tolerated = (text: string): boolean => tolerate?.test(text) ?? false;

      page.on('console', (message) => {
        if (message.type() === 'error' && !tolerated(message.text())) {
          problems.push(`console: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => {
        if (!tolerated(error.message)) {
          problems.push(`uncaught: ${error.message}`);
        }
      });
      page.on('request', (request) => {
        const url = request.url();

        if (/^(data|blob|about):/.test(url)) {
          return;
        }
        if (![origin, apiOrigin].includes(new URL(url).origin)) {
          problems.push(`third party: ${url}`);
        }
      });

      await use();

      expect(problems, 'the page stayed clean').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Opens a page in a language and waits for the app to take it over from the prerender */
export async function open(page: Page, path: string, lang: Lang = Lang.English): Promise<void> {
  await page.goto(`${localeOf(lang).prefix}${path}`);
  await hydrated(page);
  // Lazy route chunks and the first reveal have landed, so a click hits a settled page
  await page.waitForLoadState('networkidle');
}

/** The header publishes its height once it has rendered in the browser, which is hydration done */
export async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.documentElement.style.getPropertyValue('--header-height') !== '',
  );
}

/** A header link, opening the narrow-screen menu first when that is where it lives */
export async function headerLink(page: Page, name: string | RegExp): Promise<Locator> {
  const toggle = page.locator('.nav-toggle');

  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
      await pressInPlace(page, toggle);
    }
  }

  return page.locator('#site-nav').getByRole('link', { name });
}

/**
 * Presses a control where it stands. Playwright's scroll into view moves the page under a
 * control in the sticky header, which is always on screen, and a finger would not.
 */
export async function pressInPlace(page: Page, control: Locator): Promise<void> {
  const box = await control.boundingBox();
  if (box === null) {
    throw new Error('the control has no box to press');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** The open pop-up, whichever it is */
export function dialog(page: Page): Locator {
  return page.getByRole('dialog');
}

/** Whether the page marks itself as showing a pop-up */
export async function hasModal(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.classList.contains('has-modal'));
}

/** Today as the site writes it, UTC */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
