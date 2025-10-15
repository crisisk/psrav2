import { test, expect } from '@playwright/test';

test.describe('Signup Page E2E Tests', () => {
  const SIGNUP_ROUTE = '/signup';

  test.beforeEach(async ({ page }) => {
    await page.goto(SIGNUP_ROUTE);
  });

  test('should navigate to the signup page and display the main components', async ({ page }) => {
    // 1. Check for correct URL and page title
    await expect(page).toHaveURL(new RegExp(SIGNUP_ROUTE + '$'));
    await expect(page.getByRole('heading', { name: /Sign up for PSRA-LTSD/i })).toBeVisible();

    // 2. Check for form elements visibility
    const emailInput = page.getByLabel(/Email address/i);
    const passwordInput = page.getByLabel(/^Password$/i);
    const confirmPasswordInput = page.getByLabel(/Confirm Password/i);
    const submitButton = page.getByRole('button', { name: /Sign Up/i });
    const loginLink = page.getByRole('link', { name: /Already have an account\?/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(loginLink).toBeVisible();
  });

  test('should display validation errors when submitting an empty form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Sign Up/i });

    // Attempt to submit the form without filling any fields
    await submitButton.click();

    // Check for validation messages (assuming client-side validation is present)
    // Note: The exact selector for error messages may vary (e.g., role='alert', specific class)
    // Using a generic text search for common error messages as a fallback.
    await expect(page.getByText(/Email is required/i)).toBeVisible();
    await expect(page.getByText(/Password is required/i)).toBeVisible();
    await expect(page.getByText(/Please confirm your password/i)).toBeVisible();
  });

  test('should display error for invalid email format', async ({ page }) => {
    const emailInput = page.getByLabel(/Email address/i);
    const submitButton = page.getByRole('button', { name: /Sign Up/i });

    await emailInput.fill('invalid-email');
    await submitButton.click();

    // Check for invalid email format error
    await expect(page.getByText(/Invalid email format/i)).toBeVisible();
  });

  test('should display error when passwords do not match', async ({ page }) => {
    const emailInput = page.getByLabel(/Email address/i);
    const passwordInput = page.getByLabel(/^Password$/i);
    const confirmPasswordInput = page.getByLabel(/Confirm Password/i);
    const submitButton = page.getByRole('button', { name: /Sign Up/i });

    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePassword123');
    await confirmPasswordInput.fill('MismatchedPassword456');

    await submitButton.click();

    // Check for password mismatch error
    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  });

  test('should allow navigation to the login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Already have an account\?/i });
    
    await loginLink.click();

    // Assert that the page has navigated to the login route
    await expect(page).toHaveURL(new RegExp('/login$'));
    await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible();
  });
});