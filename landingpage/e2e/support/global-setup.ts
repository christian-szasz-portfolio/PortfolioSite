import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

/** The suite tests the build, so a missing or stale one is refused up front */
export default function globalSetup(): void {
  const built = path.resolve('dist/landing-ng/browser/index.html');

  if (!existsSync(built)) {
    throw new Error('No build to test. Run `npm run build` first.');
  }

  const age = (Date.now() - statSync(built).mtimeMs) / 3_600_000;

  if (age > 24) {
    console.warn(
      `The build under test is ${Math.round(age)} hours old. Run \`npm run build\` if src has moved on.`,
    );
  }
}
