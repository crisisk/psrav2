import { test, expect } from '@playwright/test';

test.describe('Product Creation Page E2E Tests', () => {
  const route = '/products/create_page';

  test('should navigate to the product creation page and display the form', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route.
    await test.step('Navigate to the Product Creation page', async () => {
      await page.goto(route);
      // Wait for the page to load and the main content to be visible
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible.
    await test.step('Verify key elements are visible', async () => {
      // Assert the main page header/title
      const pageTitle = page.getByRole('heading', { name: /Create New Product|Add Product/i });
      await expect(pageTitle).toBeVisible();

      // Assert the presence of the main form
      const productForm = page.getByRole('form', { name: /Product Details|Create Product Form/i });
      await expect(productForm).toBeVisible();
    });

    // 3. Functionality (Form Elements): Check for key input fields and the submit button.
    await test.step('Verify form input fields and action buttons are present', async () => {
      // Check for a required input field, e.g., Product Name
      const productNameInput = page.getByRole('textbox', { name: /Product Name|Name/i });
      await expect(productNameInput).toBeVisible();
      await expect(productNameInput).toBeEnabled();

      // Check for a description field (could be a textarea)
      const productDescriptionInput = page.getByRole('textbox', { name: /Description/i });
      await expect(productDescriptionInput).toBeVisible();

      // Check for a required action button, e.g., Save or Create
      const createButton = page.getByRole('button', { name: /Create|Save|Submit/i });
      await expect(createButton).toBeVisible();
      // Initially, the button might be disabled if required fields are empty.
      // A more comprehensive test would check for initial disabled state and then enabled state after filling the form.
      // For this basic E2E test, we just check for visibility.
    });
  });

  test('should allow a user to fill out the form fields', async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    // Define test data
    const testProductName = `Test Product ${Date.now()}`;
    const testProductDescription = 'This is a description for a new test product.';

    // Locate fields using robust selectors
    const productNameInput = page.getByRole('textbox', { name: /Product Name|Name/i });
    const productDescriptionInput = page.getByRole('textbox', { name: /Description/i });

    await test.step('Fill out the form fields', async () => {
      await productNameInput.fill(testProductName);
      await productDescriptionInput.fill(testProductDescription);

      // Assert that the values were entered correctly
      await expect(productNameInput).toHaveValue(testProductName);
      await expect(productDescriptionInput).toHaveValue(testProductDescription);
    });
  });

  // NOTE: A full E2E test would also include a test for successful form submission
  // and redirection, but without knowing the exact backend behavior and subsequent
  // page, we focus on the client-side form interaction and visibility.
});