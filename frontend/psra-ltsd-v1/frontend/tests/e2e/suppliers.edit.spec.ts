import { test, expect } from '@playwright/test';

// Assuming a test environment where a supplier with ID '1' exists for editing.
// In a real-world scenario, this ID would be dynamically created or fetched
// during a setup step (e.g., via API).
const SUPPLIER_ID = '1';
const EDIT_PAGE_ROUTE = `/suppliers/edit_page?id=${SUPPLIER_ID}`;

test.describe('Supplier Edit Page E2E Tests', () => {
  test('should navigate to the edit page and display the form correctly', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Supplier Edit page', async () => {
      await page.goto(EDIT_PAGE_ROUTE);
      // Wait for the main content to load
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and header elements', async () => {
      // Assert the page title contains "Edit Supplier" or similar text
      await expect(page).toHaveTitle(/Edit Supplier|Leverancier Bewerken/i);
      
      // Assert the main heading is visible (using role for robustness)
      const pageHeading = page.getByRole('heading', { name: /Edit Supplier|Leverancier Bewerken/i, level: 1 });
      await expect(pageHeading).toBeVisible();
    });

    // 3. Functionality: Check for form elements and action buttons
    await test.step('Verify the presence of key form fields', async () => {
      // Check for a form element
      const editForm = page.getByRole('form', { name: /Edit Supplier Form|Leverancier Bewerken Formulier/i });
      await expect(editForm).toBeVisible();

      // Check for common supplier fields (using role and placeholder/label for robustness)
      await expect(page.getByRole('textbox', { name: /Supplier Name|Naam Leverancier/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /Address|Adres/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /VAT Number|BTW Nummer/i })).toBeVisible();
      
      // Check that the input fields are pre-filled with data (a basic check for edit functionality)
      // This is a placeholder check, as actual data validation requires knowing the expected value.
      const nameInput = page.getByRole('textbox', { name: /Supplier Name|Naam Leverancier/i });
      const currentValue = await nameInput.inputValue();
      await expect(currentValue.length).toBeGreaterThan(0);
    });

    await test.step('Verify the presence of action buttons', async () => {
      // Check for the primary action button (Save/Update)
      await expect(page.getByRole('button', { name: /Save|Update|Opslaan|Bijwerken/i })).toBeVisible();
      
      // Check for the secondary action button (Cancel/Back)
      await expect(page.getByRole('link', { name: /Cancel|Back|Annuleren|Terug/i })).toBeVisible();
    });
  });

  // Optional: Add a test for form submission (positive or negative case)
  test('should allow editing and saving a supplier (placeholder)', async ({ page }) => {
    await page.goto(EDIT_PAGE_ROUTE);
    await page.waitForLoadState('networkidle');

    // Find a field and change its value
    const nameInput = page.getByRole('textbox', { name: /Supplier Name|Naam Leverancier/i });
    await nameInput.fill(`Test Supplier Edited ${Date.now()}`);

    // Click the save button
    const saveButton = page.getByRole('button', { name: /Save|Update|Opslaan|Bijwerken/i });
    await saveButton.click();

    // Assert redirection or success message (assuming redirection to the list page or detail page)
    // The actual assertion depends on the application's behavior after a successful save.
    // Placeholder: Assert that the URL changes, typically back to the list page.
    await page.waitForURL(/suppliers\/list|suppliers\/\d+/);
    await expect(page).not.toHaveURL(EDIT_PAGE_ROUTE);
    
    // In a real test, you would also verify a success notification or fetch the data via API to confirm the update.
  });
});