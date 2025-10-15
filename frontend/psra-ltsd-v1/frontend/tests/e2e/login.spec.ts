import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a user to log in successfully', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Check if the login form is visible
    await expect(page.getByRole('heading', { name: 'Sign in to Sevensa PSRA-LTSD' })).toBeVisible();

    // Fill in the credentials
    await page.getByLabel('Email address').fill('psra-manager@sevensa.com');
    await page.getByLabel('Password').fill('secure-password-123');

    // Click the sign-in button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Expect to be redirected to the dashboard
    // The actual check will depend on the final implementation, but for now, we check for the dashboard URL or a key element.
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
  });

  test('should display an error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.getByLabel('Email address').fill('invalid@sevensa.com');
    await page.getByLabel('Password').fill('wrong-password');

    // Click the sign-in button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Expect an error message to be visible
    await expect(page.getByText('Invalid credentials. Please try again.')).toBeVisible();
    
    // Expect to remain on the login page
    await expect(page).toHaveURL('/login');
  });
});
