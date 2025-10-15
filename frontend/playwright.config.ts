import { defineConfig } from '@playwright/test';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

const baseURL = process.env.APP_URL_STAGING ?? 'http://127.0.0.1:3000';
const browsers = (process.env.BROWSERS ?? 'chromium,firefox,webkit')
  .split(',')
  .map(browser => browser.trim() as BrowserName)
  .filter((browser): browser is BrowserName => ['chromium', 'firefox', 'webkit'].includes(browser));

const projects = browsers.map(name => ({
  name,
  use: {
    browserName: name,
    viewport: { width: 1440, height: 900 }
  }
}));

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'tests/ux-retention/artifacts/test-output',
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: {
    timeout: 10_000
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/ux-retention/reports/playwright-html' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000
  },
  projects,
  webServer: process.env.APP_URL_STAGING
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI
      }
});
