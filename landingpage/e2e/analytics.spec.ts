import { ConsentChoice } from './support/site';
import { expect, headerLink, open, test } from './support/fixtures';

/** A batch waits five seconds for company before it is sent */
const FLUSH_DELAY = 5_000;

test.describe('with consent', () => {
  test.use({ consent: ConsentChoice.Granted });

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
  });

  test('reports the page opened, batched after a pause', async ({ page, api }) => {
    await open(page, '/');
    expect(api.events(), 'nothing before the batch is due').toEqual([]);

    await page.clock.fastForward(FLUSH_DELAY + 500);

    await expect.poll(() => api.events()).toContainEqual({ kind: 'route', target: '/' });
    const call = api.calls.find((entry) => entry.path === '/api/interactions');
    expect(call?.method).toBe('POST');
  });

  test('reports the sections a reader reaches', async ({ page, api }) => {
    await open(page, '/');

    for (const section of ['work', 'thinking', 'about']) {
      await page.locator(`#${section}`).scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 200);
      await page.clock.fastForward(300);
    }
    await page.clock.fastForward(FLUSH_DELAY + 500);

    await expect
      .poll(() =>
        api
          .events()
          .filter((event) => event.kind === 'section')
          .map((event) => event.target),
      )
      .toEqual(expect.arrayContaining(['work', 'about']));
  });

  test('reports a project opened from its card', async ({ page, api }) => {
    await open(page, '/');

    await page.locator('.project .button--primary').nth(1).click();
    await expect(page.locator('h1')).toHaveText('Taskly');
    await page.clock.fastForward(FLUSH_DELAY + 500);

    await expect
      .poll(() => api.events())
      .toEqual(
        expect.arrayContaining([
          { kind: 'project.read', target: 'taskly' },
          { kind: 'route', target: '/work/taskly' },
        ]),
      );
  });

  test('reports the CV opened', async ({ page, api }) => {
    await open(page, '/');

    await (await headerLink(page, 'CV')).click();
    await page.clock.fastForward(FLUSH_DELAY + 500);

    await expect.poll(() => api.events()).toContainEqual({ kind: 'cv.open' });
  });

  test.describe('downloading', () => {
    // Packing fetches a photo that is not there; see the CV spec
    test.use({ tolerate: /status of 404/ });

    test('reports the CV source downloaded', async ({ page, api }) => {
      await open(page, '/');
      await (await headerLink(page, 'CV')).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Download' }).click();

      const zip = page.waitForEvent('download');
      await page.getByRole('menuitem', { name: /Whole source/ }).click();
      await zip;
      await page.clock.fastForward(FLUSH_DELAY + 500);

      await expect.poll(() => api.events()).toContainEqual({ kind: 'cv.download.source' });
    });
  });

  test('sends what is queued when the reader leaves', async ({ page, api }) => {
    await open(page, '/');
    await (await headerLink(page, 'CV')).click();

    const beacon = page.waitForRequest((request) => request.url().endsWith('/api/interactions'));
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    await beacon;

    await expect.poll(() => api.events()).toContainEqual({ kind: 'cv.open' });
  });

  test('never sends a batch larger than the endpoint takes', async ({ page, api }) => {
    await open(page, '/');

    for (let round = 0; round < 30; round++) {
      await (await headerLink(page, 'CV')).click();
      await expect(page.getByRole('dialog').locator('lpg-cv-document')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await page.clock.fastForward(FLUSH_DELAY + 500);

    await expect
      .poll(() => api.events().filter((event) => event.kind === 'cv.open').length)
      .toBeGreaterThanOrEqual(30);
    for (const call of api.calls.filter((entry) => entry.path === '/api/interactions')) {
      expect((call.body as { events: unknown[] }).events.length).toBeLessThanOrEqual(25);
    }
  });
});

test.describe('without consent', () => {
  test.use({ consent: ConsentChoice.Denied });

  test('nothing a reader does is sent', async ({ page, api }) => {
    await page.clock.install();
    await open(page, '/');

    await page.locator('#about').scrollIntoViewIfNeeded();
    await (await headerLink(page, 'CV')).click();
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    await page.clock.fastForward(FLUSH_DELAY * 3);

    expect(api.calls).toEqual([]);
  });
});
