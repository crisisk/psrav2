import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'list',
  timeout: 90000, // 90 second timeout for tests

  use: {
    baseURL: 'http://localhost:8090',
    trace: 'on-first-retry',
    screenshot: 'on',
    navigationTimeout: 75000, // 75 seconds for page navigation
    actionTimeout: 15000, // 15 seconds for actions
    launchOptions: {
      env: {
        PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW: '0',
      },
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8090',
    reuseExistingServer: true,
  },
});
