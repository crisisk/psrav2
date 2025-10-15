import { test, expect } from '@playwright/test';

// Define the base URL for the application, assuming it's set in the Playwright config
const AI_ACT_COVER_ROUTE = '/compliance/ai-act/cover';
const PAGE_TITLE_TEXT = 'AI Act Compliance: Cover Page'; // A reasonable guess for the main heading

test.describe('AI Act Compliance Cover Page', () => {
  test('should navigate to the cover page and display key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the AI Act Cover page', async () => {
      await page.goto(AI_ACT_COVER_ROUTE);
      // Assert that the URL is correct
      await expect(page).toHaveURL(new RegExp(AI_ACT_COVER_ROUTE + '$'));
    });

    // 2. Visibility and Content
    await test.step('Verify the main heading and page structure are visible', async () => {
      // Check for the main page title/heading using a role selector for robustness
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(mainHeading).toBeVisible();

      // Check for a main content area or section
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for the presence of a primary call-to-action button,
      // which is typical for a "cover" or "start" page in a workflow.
      const startButton = page.getByRole('button', { name: /start|begin|continue/i });
      await expect(startButton).toBeVisible();
      await expect(startButton).toBeEnabled();
    });

    // 3. Robustness Check (e.g., checking for the navigation bar)
    await test.step('Verify common application elements are present', async () => {
      // Check for the application's main navigation bar
      const navBar = page.getByRole('navigation', { name: /main|primary/i });
      await expect(navBar).toBeVisible();
    });
  });

  // Optional: Add a test to ensure the "Start" button leads to the next step
  test('should allow navigation to the next step in the compliance process', async ({ page }) => {
    await page.goto(AI_ACT_COVER_ROUTE);

    const startButton = page.getByRole('button', { name: /start|begin|continue/i });
    await expect(startButton).toBeVisible();

    // Click the button
    await startButton.click();

    // Assert that the page navigates away, indicating the start of the workflow.
    // The exact next route is unknown, so we check for a change in URL.
    // A common next step might be a 'details' or 'form' page.
    await expect(page).not.toHaveURL(new RegExp(AI_ACT_COVER_ROUTE + '$'));
    // A more specific assertion would be:
    // await expect(page).toHaveURL(/compliance\/ai-act\/details/);
  });
});