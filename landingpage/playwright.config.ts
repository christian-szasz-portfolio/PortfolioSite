import { defineConfig, devices } from '@playwright/test';

/** The production build, served with the host's routes and headers, CSP included */
const PORT = 4175;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/** Firefox and WebKit are opt-in: `npx playwright install firefox webkit` first */
const everyEngine = process.env['E2E_ALL_BROWSERS'] === '1';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e-results/artifacts',
  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  // One retry locally too: Windows can run short of socket buffers late in a long run, and a
  // retried pass is reported as flaky rather than hidden
  retries: process.env['CI'] !== undefined ? 2 : 1,
  // One static server behind them all; more than this runs Windows out of socket buffers
  workers: 4,
  reporter: [['list'], ['html', { outputFolder: 'e2e-results/report', open: 'never' }]],
  globalSetup: './e2e/support/global-setup.ts',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    colorScheme: 'dark',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ...(everyEngine
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 900 } },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 } },
          },
          { name: 'iphone', use: { ...devices['iPhone 14'] } },
        ]
      : []),
  ],

  webServer: {
    command: 'npx site-tools serve-rewrites --site portfolio',
    url: `${BASE_URL}/robots.txt`,
    reuseExistingServer: process.env['CI'] === undefined,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
