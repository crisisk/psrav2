import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-24';
const PAGE_TITLE_REGEX = /Dashboard: Slide 24/i;

test.describe('Dashboard Slide 24 Page E2E Tests', () => {
  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Dashboard Slide 24 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the network to be idle and the page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertions
    await test.step('Verify page title and main heading', async () => {
      // Check the document title
      await expect(page).toHaveTitle(PAGE_TITLE_REGEX);

      // Check for a main heading (e.g., h1 or a prominent role like 'heading')
      // Assuming the main title of the slide is the most prominent heading
      const mainHeading = page.getByRole('heading', { name: 'Slide 24', level: 1 }).or(
        page.getByRole('heading', { name: 'Dashboard', level: 1 })
      );
      await expect(mainHeading).toBeVisible();
    });

    await test.step('Verify main content area and common dashboard elements', async () => {
      // Check for the main content container (assuming a role like 'main' or a test-id)
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a common dashboard element, like a navigation bar or a key metric card
      // This is a placeholder and should be refined if specific elements are known.
      const navBar = page.getByRole('navigation', { name: /main|primary/i });
      await expect(navBar).toBeVisible();

      // Check for a generic element that signifies the slide content is loaded, e.g., a chart or a card
      const slideContentCard = page.getByRole('region', { name: /slide content|dashboard view/i }).or(
        page.getByTestId('slide-24-content')
      );
      // If the page is complex, we expect a dedicated content area to be present.
      await expect(slideContentCard).toBeVisible();
    });

    // 3. Functionality (if applicable - e.g., navigation controls for slides)
    await test.step('Verify presence of slide navigation controls (if applicable)', async () => {
      // Check for a 'Next' button or link, common in slide/step-based UIs
      const nextButton = page.getByRole('button', { name: /next|forward/i }).or(
        page.getByRole('link', { name: /next|forward/i })
      );
      // We use `toBeAttached` instead of `toBeVisible` as these buttons might be conditionally hidden
      // or styled in a way that makes them not immediately visible, but their presence is important.
      // If they are expected to be visible, change to `toBeVisible()`.
      await expect(nextButton).toBeAttached();

      // Check for a 'Previous' button or link
      const prevButton = page.getByRole('button', { name: /previous|back/i }).or(
        page.getByRole('link', { name: /previous|back/i })
      );
      await expect(prevButton).toBeAttached();
    });
  });
});