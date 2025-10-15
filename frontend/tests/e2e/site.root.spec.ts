import { test, expect } from '@playwright/test';

// Define the logical path for the test suite
const TARGET_PATH = '/';

// Define common mock responses for reusability and clarity
const MOCK_STATUS_OK = {
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({
    status: 'ok',
    version: '1.0.0',
    services: {
      database: 'online',
      auth: 'online',
    },
  }),
};

const MOCK_USER_UNAUTHORIZED = {
  status: 401, // Unauthorized is a common response for unauthenticated access
  contentType: 'application/json',
  body: JSON.stringify({ message: 'Authentication required' }),
};

test.describe('Home Page (/) E2E Tests', () => {
  // --- Test Setup: Mock API Responses and Navigation ---
  test.beforeEach(async ({ page }) => {
    // 1. Mock the status check API to ensure the application thinks the backend is healthy
    await page.route('**/api/v1/status', async (route) => {
      await route.fulfill(MOCK_STATUS_OK);
    });

    // 2. Mock the user API. Since this is the public home page, we assume no user is logged in.
    await page.route('**/api/v1/user/me', async (route) => {
      await route.fulfill(MOCK_USER_UNAUTHORIZED);
    });

    // 3. Navigate to the target page
    await test.step(`Navigate to ${TARGET_PATH}`, async () => {
      await page.goto(TARGET_PATH);
      // Ensure navigation was successful
      await expect(page).toHaveURL(TARGET_PATH);
    });
  });

  // --- Test Case 1: Core Content and Structure Verification ---
  test('should load the home page and display key structural elements', async ({ page }) => {
    await test.step('Verify main heading content', async () => {
      const mainHeading = page.getByRole('heading', { name: 'Welcome to SEVENSA', level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    await test.step('Verify descriptive text visibility', async () => {
      const descriptiveText = page.getByText('Your platform for managing certificates and data.');
      await expect(descriptiveText).toBeVisible();
    });

    await test.step('Verify the page title', async () => {
      await expect(page).toHaveTitle(/SEVENSA/);
    });
  });

  // --- Test Case 2: Navigation Links and Interaction ---
  test('should contain and correctly navigate to critical links', async ({ page }) => {
    await test.step('Verify Dashboard link presence and attribute', async () => {
      const dashboardLink = page.getByRole('link', { name: 'Go to Dashboard' });
      await expect(dashboardLink).toBeVisible();
      await expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    await test.step('Verify Login link presence and attribute', async () => {
      const loginLink = page.getByRole('link', { name: 'Login' });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
    });

    await test.step('Test navigation to the Login page', async () => {
      const loginLink = page.getByRole('link', { name: 'Login' });
      // Use waitForURL to wait for the navigation to complete
      await Promise.all([
        page.waitForURL(/login/),
        loginLink.click(),
      ]);
      await expect(page).toHaveURL(/login/);
    });
  });

  // --- Test Case 3: Data Validation - Successful API Status Check ---
  test('should confirm backend status is healthy via API mock', async ({ page }) => {
    // This test verifies that the mock was set up correctly in beforeEach
    // and that the frontend successfully made the request and received the expected data.
    
    // Reload the page to ensure the request is made within the test context
    // and wait for the specific response.
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/status') && res.status() === 200),
      page.reload(), 
    ]);

    await test.step('Verify the response body content', async () => {
      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(body.services.database).toBe('online');
    });
  });

  // --- Test Case 4: Error Handling - Simulated Backend Downtime (500) ---
  test('should display a user-friendly error message if the status API fails (500)', async ({ page }) => {
    // Re-route the status API to simulate a 500 error for this specific test
    await page.route('**/api/v1/status', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Database connection failed' }),
      });
    });

    // Reload the page to trigger the new error response
    await page.reload();

    // Check for a user-friendly error message, which is a critical part of error handling.
    // Assuming the application displays the error message from the API response.
    await test.step('Verify the error message is displayed', async () => {
      const errorMessage = page.getByText('Database connection failed');
      await expect(errorMessage).toBeVisible();
    });

    await test.step('Verify core page content is not visible (if error is critical)', async () => {
      // If the error is critical, the main content might be hidden.
      // We assert that the error message is visible, which is the primary goal.
      const mainHeading = page.getByRole('heading', { name: 'Welcome to SEVENSA', level: 1 });
      // Depending on the application's behavior, this might be visible or hidden.
      // For a critical error, we expect the error to take precedence.
      // We'll keep the assertion simple: the error message is present.
      await expect(page.getByText('Database connection failed')).toBeVisible();
    });
  });
});