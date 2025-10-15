import { test, expect } from '@playwright/test';

// Define the route for the partner login page
const PARTNER_LOGIN_ROUTE = '/partners/partner_login';

test.describe('Partner Login Page E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PARTNER_LOGIN_ROUTE);
  });

  test('should load the partner login page and display key elements', async ({ page }) => {
    // 1. Check for successful navigation and page title (assuming a title like "Partner Login" or similar)
    await expect(page).toHaveURL(PARTNER_LOGIN_ROUTE);
    await expect(page.getByRole('heading', { name: /Partner Login|Sign In/i })).toBeVisible();

    // 2. Check for the login form and its elements
    const loginForm = page.getByRole('form', { name: /login|sign in/i });
    await expect(loginForm).toBeVisible();

    // Check for username/email input field
    await expect(loginForm.getByRole('textbox', { name: /email|username/i })).toBeVisible();

    // Check for password input field
    await expect(loginForm.getByLabel(/password/i)).toBeVisible();

    // Check for the submit button
    await expect(loginForm.getByRole('button', { name: /login|sign in/i })).toBeVisible();

    // Check for a potential "Forgot Password" link
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('should display an error message on failed login attempt', async ({ page }) => {
    // Use placeholder values for a guaranteed failed login
    const emailInput = page.getByRole('textbox', { name: /email|username/i });
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /login|sign in/i });

    // Fill the form with invalid credentials
    await emailInput.fill('invalid.partner@example.com');
    await passwordInput.fill('wrongpassword123');

    // Click the login button
    await loginButton.click();

    // Assert that an error message is displayed (e.g., "Invalid credentials")
    // We use a generic selector for an alert or error message container
    const errorMessage = page.getByRole('alert').or(page.getByText(/invalid credentials|login failed/i));
    await expect(errorMessage).toBeVisible();

    // Optional: Assert that the page URL remains the same (no redirect)
    await expect(page).toHaveURL(PARTNER_LOGIN_ROUTE);
  });

  // NOTE: A test for successful login is typically added here, but requires
  // valid, non-production credentials or a mocked API response.
  // For a production-ready test suite, this should be implemented using
  // a fixture or API mocking to ensure a clean, reliable test environment.
  /*
  test('should successfully log in and redirect to the dashboard', async ({ page }) => {
    // ... logic to fill form with valid credentials ...
    // ... click login button ...
    // await expect(page).not.toHaveURL(PARTNER_LOGIN_ROUTE);
    // await expect(page).toHaveURL(/dashboard/); // Assert redirect to dashboard
  });
  */
});