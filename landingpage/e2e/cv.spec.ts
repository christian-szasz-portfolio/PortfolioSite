import { readFileSync } from 'node:fs';

import { type Download, type Locator, type Page } from '@playwright/test';

import { locales, t } from './support/site';
import { dialog, expect, hasModal, headerLink, open, test } from './support/fixtures';

/** The zoom the CV viewer reports, as a number of percent */
async function zoomLevel(page: Page): Promise<number> {
  return Number.parseInt((await dialog(page).locator('.zoom__level').textContent()) ?? '', 10);
}

/** Opens the CV pop-up from the header, the way most readers do */
async function openCv(page: Page): Promise<Locator> {
  await (await headerLink(page, 'CV')).click();
  const viewer = dialog(page);
  await expect(viewer.locator('.modal__sheet lpg-cv-document')).toBeVisible();

  return viewer;
}

/** The bytes of a finished download */
async function bytesOf(download: Download): Promise<Buffer> {
  const path = await download.path();

  return readFileSync(path);
}

test.describe('the CV page', () => {
  for (const locale of locales) {
    test(`${locale.prefix}/cv fits one A4 page on screen`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'A phone reflows the sheet into one column');
      await open(page, '/cv', locale.lang);

      const sheet = page.locator('article.cv');
      await expect(sheet).toBeVisible();
      await expect(page.locator('.cv-profile__photo')).toHaveJSProperty('complete', true);
      await expect(page.locator('.cv-page-number')).toHaveText('1/1');

      const size = await sheet.evaluate((element: HTMLElement) => ({
        width: element.offsetWidth,
        height: element.offsetHeight,
      }));
      expect(size.width, 'A4 width at 96 dpi').toBeCloseTo(794, -1);
      expect(size.height, 'A4 height at 96 dpi').toBeCloseTo(1123, -1);

      for (const column of ['.cv__sidebar', '.cv__main']) {
        const spill = await sheet
          .locator(column)
          .evaluate((element: HTMLElement) => element.scrollHeight - element.clientHeight);
        expect(spill, `${column} keeps to the page`).toBeLessThanOrEqual(1);
      }

      const last = await page
        .locator('.cv-page-number')
        .evaluate((element) => element.getBoundingClientRect().bottom);
      const bottom = await sheet.evaluate((element) => element.getBoundingClientRect().bottom);
      expect(last).toBeLessThanOrEqual(bottom);
    });

    test(`${locale.prefix}/cv prints on exactly one A4 page`, async ({
      page,
      browserName,
      isMobile,
    }) => {
      test.skip(
        browserName !== 'chromium' || isMobile,
        'Printing to PDF is a desktop Chromium feature',
      );
      await open(page, '/cv', locale.lang);
      await page.evaluate(() => document.fonts.ready);

      const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
      const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];

      expect(pages).toHaveLength(1);
    });
  }

  test('sets its sheet in Poppins, served from the site', async ({ page }) => {
    await open(page, '/cv');
    await page.evaluate(() => document.fonts.ready);

    const loaded = await page.evaluate(() => document.fonts.check('12px Poppins'));
    expect(loaded).toBe(true);
  });
});

test.describe('the CV pop-up', () => {
  test('opens from the header rather than leaving the page', async ({ page }) => {
    await open(page, '/');
    const viewer = await openCv(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(viewer.getByRole('heading', { name: 'Curriculum vitae' })).toBeVisible();
    await expect(viewer).toHaveAttribute('aria-labelledby', 'cv-modal-title');
    expect(await hasModal(page)).toBe(true);
  });

  test('opens from the card in the about section', async ({ page }) => {
    await open(page, '/');
    await page.locator('.cv-card .button--primary').click();

    await expect(dialog(page).getByRole('heading', { name: 'Curriculum vitae' })).toBeVisible();
  });

  for (const locale of locales) {
    test(`is titled in ${locale.lang}`, async ({ page }) => {
      await open(page, '/', locale.lang);
      const viewer = await openCv(page);

      await expect(viewer.locator('.modal__title')).toHaveText(t(locale.lang, 'cv.modal.title'));
    });
  }

  test('a modified click opens the CV page in a new tab instead', async ({
    page,
    context,
    isMobile,
  }) => {
    test.skip(isMobile, 'No modifier keys on a phone');
    await open(page, '/');

    const opened = context.waitForEvent('page');
    await page.locator('.site-nav__link--cta').click({ modifiers: ['Control'] });
    const tab = await opened;

    await tab.waitForLoadState();
    expect(new URL(tab.url()).pathname).toBe('/cv');
    await expect(dialog(page)).toHaveCount(0);
  });

  test('closes with its button, with Escape, and hands the page back', async ({
    page,
    isMobile,
  }) => {
    await open(page, '/');

    await openCv(page);
    await dialog(page).getByRole('button', { name: 'Close the CV' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect.poll(() => hasModal(page)).toBe(false);

    await openCv(page);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);

    if (!isMobile) {
      await expect(
        page.locator('.site-nav__link--cta'),
        'focus returns to what opened it',
      ).toBeFocused();
    }
  });

  test('starts at true size on a desktop and fitted on a phone', async ({ page, isMobile }) => {
    await open(page, '/');
    await openCv(page);

    if (isMobile) {
      await expect.poll(() => zoomLevel(page)).toBeLessThan(100);
    } else {
      await expect.poll(() => zoomLevel(page)).toBe(100);
      await expect(dialog(page).locator('.modal__viewport')).toBeFocused();
    }
  });

  test('zooms with its buttons and fits to the width', async ({ page }) => {
    await open(page, '/');
    const viewer = await openCv(page);
    const start = await zoomLevel(page);

    await viewer.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(() => zoomLevel(page)).toBe(start + 15);

    // Never below 35%, which a phone's fitted start is close to
    await viewer.getByRole('button', { name: 'Zoom out' }).click();
    await viewer.getByRole('button', { name: 'Zoom out' }).click();
    await expect.poll(() => zoomLevel(page)).toBe(Math.max(35, start - 15));

    await viewer.getByRole('button', { name: 'Fit' }).click();
    const fitted = await viewer
      .locator('.modal__viewport')
      .evaluate((element) => element.clientWidth);
    await expect
      .poll(() =>
        viewer.locator('.modal__stage').evaluate((element: HTMLElement) => element.offsetWidth),
      )
      .toBeLessThanOrEqual(fitted);
  });

  test('zooms by keyboard and by Ctrl and the wheel, within its limits', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Keys and a wheel are desktop input');
    await open(page, '/');
    const viewer = await openCv(page);

    await page.keyboard.press('+');
    await expect.poll(() => zoomLevel(page)).toBe(115);
    await page.keyboard.press('=');
    await expect.poll(() => zoomLevel(page)).toBe(130);
    await page.keyboard.press('-');
    await expect.poll(() => zoomLevel(page)).toBe(115);
    await page.keyboard.press('0');
    await expect.poll(() => zoomLevel(page)).toBe(100);

    const box = await viewer.locator('.modal__viewport').boundingBox();
    if (box === null) {
      throw new Error('The viewer has no box');
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120);
    await page.keyboard.up('Control');
    await expect.poll(() => zoomLevel(page)).toBeGreaterThan(100);

    for (let press = 0; press < 20; press++) {
      await page.keyboard.press('+');
    }
    await expect.poll(() => zoomLevel(page)).toBe(300);

    for (let press = 0; press < 25; press++) {
      await page.keyboard.press('-');
    }
    await expect.poll(() => zoomLevel(page)).toBe(35);

    expect(
      await page.evaluate(() => window.devicePixelRatio),
      'the browser zoom was left alone',
    ).toBe(1);
  });

  test('a plain wheel pans the sheet rather than zooming', async ({ page, isMobile }) => {
    test.skip(isMobile, 'A wheel is desktop input');
    await open(page, '/');
    const viewer = await openCv(page);
    const surface = viewer.locator('.modal__viewport');
    const box = await surface.boundingBox();
    if (box === null) {
      throw new Error('The viewer has no box');
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 400);

    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await zoomLevel(page)).toBe(100);
  });

  test('its download menu opens, walks by arrow keys and closes on Escape before the pop-up does', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Arrow keys are desktop input');
    await open(page, '/');
    const viewer = await openCv(page);
    const trigger = viewer.getByRole('button', { name: 'Download' });

    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const items = viewer.getByRole('menuitem');
    await expect(items).toHaveCount(2);

    await page.keyboard.press('ArrowDown');
    await expect(items.first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.last()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(viewer.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(viewer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
  });

  test('its download menu closes on a click elsewhere', async ({ page }) => {
    await open(page, '/');
    const viewer = await openCv(page);

    await viewer.getByRole('button', { name: 'Download' }).click();
    await expect(viewer.getByRole('menu')).toBeVisible();

    await viewer.locator('.modal__title').click();
    await expect(viewer.getByRole('menu')).toHaveCount(0);
  });

  test.describe('downloading', () => {
    // The rasteriser's copy injects styles the CSP refuses, harmlessly; the 404 is the defect below
    test.use({ tolerate: /Content Security Policy|status of 404/ });
    test.slow();

    test('as PDF gives one A4 page with the sheet drawn on it', async ({ page }) => {
      await open(page, '/');
      const viewer = await openCv(page);
      await viewer.getByRole('button', { name: 'Download' }).click();

      const pdf = page.waitForEvent('download');
      await viewer.getByRole('menuitem', { name: /As PDF/ }).click();
      const download = await pdf;

      expect(download.suggestedFilename()).toBe('CV_Christian_Szasz.pdf');
      const bytes = await bytesOf(download);
      expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
      expect(bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).toHaveLength(1);
      // A blank page is a few kilobytes; the drawn sheet is an image of hundreds
      expect(bytes.length).toBeGreaterThan(100_000);

      await expect(viewer.getByRole('menu'), 'the menu closes once the file is saved').toHaveCount(
        0,
      );
    });

    test('as the whole source gives a zip of the page, its stylesheet and its photograph', async ({
      page,
    }) => {
      await open(page, '/');
      const viewer = await openCv(page);
      await viewer.getByRole('button', { name: 'Download' }).click();

      const zip = page.waitForEvent('download');
      await viewer.getByRole('menuitem', { name: /Whole source/ }).click();
      const download = await zip;

      expect(download.suggestedFilename()).toBe('cv-source.zip');
      const bytes = await bytesOf(download);
      expect(bytes.subarray(0, 4).toString('latin1')).toBe('PK\u0003\u0004');

      const listing = bytes.toString('latin1');
      for (const entry of ['CV_Christian_Szasz.html', 'css/cv.css', 'img/photo.jpg']) {
        expect(listing, `the archive holds ${entry}`).toContain(entry);
      }
    });
  });

  test('packing the source asks the server for nothing that is not there', async ({ page }) => {
    await open(page, '/');
    const missing: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 404) {
        missing.push(response.url());
      }
    });
    const viewer = await openCv(page);
    await viewer.getByRole('button', { name: 'Download' }).click();

    const zip = page.waitForEvent('download');
    await viewer.getByRole('menuitem', { name: /Whole source/ }).click();
    await zip;
    await page.waitForLoadState('networkidle');

    expect(missing).toEqual([]);
  });

  test('opens the CV page in a tab of its own', async ({ page, context }) => {
    await open(page, '/');
    const viewer = await openCv(page);

    const opened = context.waitForEvent('page');
    await viewer.getByRole('link', { name: 'Open in a tab' }).click();
    const tab = await opened;

    await tab.waitForLoadState();
    expect(new URL(tab.url()).pathname).toBe('/cv');
    await expect(tab.locator('article.cv')).toBeVisible();
  });
});
