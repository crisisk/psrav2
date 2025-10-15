import { test, expect, type Page } from '@playwright/test';

// Define the path to the root page
const ROOT_PAGE_PATH = '/';
const DASHBOARD_SUMMARY_API = '**/api/dashboard/summary';
const CREATE_CERTIFICATE_PATH = '/certificates/create';

// Helper function to navigate and wait for the page to be ready
async function navigateToRoot(page: Page) {
  await test.step('Navigate to the root page', async () => {
    await page.goto(ROOT_PAGE_PATH);
    // Use networkidle to ensure all initial resources and API calls are complete
    await page.waitForLoadState('networkidle');
  });
}

test.describe('Root Page (/) - Dashboard Functionality', () => {

  // Test 1: Basic navigation, title, and main content display
  test('should load successfully, verify URL, title, and display main content', async ({ page }) => {
    await navigateToRoot(page);

    // 1. Verify URL and title
    await test.step('Verify URL and title', async () => {
      await expect(page).toHaveURL(ROOT_PAGE_PATH);
      // Use a more specific title pattern if possible, or a broader one for robustness
      await expect(page).toHaveTitle(/SEVENSA | Dashboard|Welcome/);
    });

    // 2. Verify main content is visible using a more robust selector
    await test.step('Verify main content is visible', async () => {
      // Look for a common element like a main heading or a dashboard container
      const mainHeading = page.getByRole('heading', { level: 1, name: /Dashboard|Welcome/i }).or(page.getByRole('heading', { level: 2 })).first();
      await expect(mainHeading).toBeVisible();
    });
  });

  // Test 2: Check for key navigation elements
  test('should display primary navigation links with correct destinations', async ({ page }) => {
    await navigateToRoot(page);

    // Define the expected navigation links
    const navLinks = [
      { name: 'Dashboard', url: '/' },
      { name: 'Certificates', url: '/certificates/list' },
      { name: 'Settings', url: '/settings' },
      // Add more expected links based on the application structure
    ];

    for (const link of navLinks) {
      await test.step(`Verify link for "${link.name}" is present and correct`, async () => {
        // Use getByRole('link') for better accessibility and robustness
        const linkLocator = page.getByRole('link', { name: link.name, exact: true });
        await expect(linkLocator).toBeVisible();
        await expect(linkLocator).toHaveAttribute('href', link.url);
      });
    }
  });

  // Test 3: Check for API data display (simulating a dashboard that fetches data)
  test('should display fetched dashboard data correctly on successful API call', async ({ page }) => {
    // 1. Mock the API call for dashboard data before navigation
    const mockData = {
      totalCertificates: 150,
      pendingApprovals: 5,
      activeUsers: 42,
    };

    await page.route(DASHBOARD_SUMMARY_API, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    await navigateToRoot(page);

    // 2. Verify the data points are displayed using more specific selectors if possible, or getByText as a fallback
    await test.step('Verify dashboard summary data points', async () => {
      // Use a combination of getByText and getByRole for better targeting
      const totalCertificatesCard = page.getByText('Total Certificates').locator('..'); // Assuming the count is a sibling/child of the label
      await expect(totalCertificatesCard.getByText(String(mockData.totalCertificates), { exact: true })).toBeVisible();

      const pendingApprovalsCard = page.getByText('Pending Approvals').locator('..');
      await expect(pendingApprovalsCard.getByText(String(mockData.pendingApprovals), { exact: true })).toBeVisible();

      const activeUsersCard = page.getByText('Active Users').locator('..');
      await expect(activeUsersCard.getByText(String(mockData.activeUsers), { exact: true })).toBeVisible();
    });
  });

  // Test 4: Error Handling - Simulate a 500 server error for the dashboard data
  test('should display a user-friendly error message on API failure (500)', async ({ page }) => {
    // 1. Mock the API call to return a 500 error before navigation
    await page.route(DASHBOARD_SUMMARY_API, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await navigateToRoot(page);

    // 2. Expect a user-friendly error message to be visible
    await test.step('Verify error message is displayed', async () => {
      // Use a more generic, case-insensitive regex for the error message
      const errorMessageLocator = page.getByText(/Failed to load dashboard data|An error occurred|500 error/i);
      await expect(errorMessageLocator).toBeVisible();
    });
  });

  // Test 5: User Interaction - Test navigation via a primary action button
  test('should navigate to the create certificate page when "Create New" button is clicked', async ({ page }) => {
    await navigateToRoot(page);

    // 1. Locate the button
    const createButton = page.getByRole('button', { name: /Create New|New Certificate/i });

    await test.step('Click the create button', async () => {
      await expect(createButton).toBeVisible();
      // Use page.waitForURL to wait for navigation after the click
      await Promise.all([
        page.waitForURL(CREATE_CERTIFICATE_PATH),
        createButton.click(),
      ]);
    });

    // 2. Verify navigation and presence of key element on the new page
    await test.step('Verify navigation to the creation page', async () => {
      await expect(page).toHaveURL(/certificates\/create/);
      // Check for the main heading on the new page
      await expect(page.getByRole('heading', { name: /Create New Certificate/i })).toBeVisible();
    });
  });

  // Test 6 (New): Check for a loading state during the API call
  test('should display a loading indicator while fetching dashboard data', async ({ page }) => {
    // 1. Mock the API call but delay the response to simulate loading
    await page.route(DASHBOARD_SUMMARY_API, async route => {
      // Delay the fulfillment by a short time (e.g., 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalCertificates: 10, pendingApprovals: 1 }),
      });
    });

    // 2. Navigate to the page
    await page.goto(ROOT_PAGE_PATH);

    // 3. Expect a loading indicator to be visible immediately after navigation
    await test.step('Verify loading indicator is visible', async () => {
      // Assuming a common loading indicator role or text
      const loadingIndicator = page.getByRole('status', { name: /loading/i }).or(page.getByText(/Loading data.../i));
      await expect(loadingIndicator).toBeVisible();
    });

    // 4. Wait for the data to load and the indicator to disappear
    await test.step('Verify loading indicator disappears after data loads', async () => {
      await page.waitForLoadState('networkidle');
      // Check for a key data point to confirm load
      await expect(page.getByText('Total Certificates')).toBeVisible();
      // The loading indicator should no longer be visible
      const loadingIndicator = page.getByRole('status', { name: /loading/i }).or(page.getByText(/Loading data.../i));
      await expect(loadingIndicator).not.toBeVisible();
    });
  });
});
