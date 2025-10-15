import { test, expect } from '@playwright/test';

// Define the route for the BOM Slide page
const BOM_SLIDE_ROUTE = '/products/bom_slide';

test.describe('BOM Slide Page E2E Tests', () => {
  test('should navigate to the BOM Slide page and verify key elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the BOM Slide page', async () => {
      await page.goto(BOM_SLIDE_ROUTE);
      // Wait for the page to load and the main content to be visible
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main heading visibility', async () => {
      // Check for the main heading, assuming it contains "Bill of Materials" or "BOM"
      const mainHeading = page.getByRole('heading', { name: /Bill of Materials|BOM/i, level: 1 });
      await expect(mainHeading).toBeVisible();
      
      // Check for a common application element like a main navigation bar
      const navBar = page.getByRole('navigation', { name: /main|primary/i });
      await expect(navBar).toBeVisible();
    });

    // 3. Functionality: Check for elements typical of a detail or form page
    await test.step('Verify presence of detail/form elements', async () => {
      // Assuming the page displays details or a form for a specific BOM
      
      // Check for a save/submit button, common in form/detail pages
      const saveButton = page.getByRole('button', { name: /Save|Submit|Update/i });
      await expect(saveButton).toBeVisible();

      // Check for a cancel/close button, typical for a "slide" component or form
      const cancelButton = page.getByRole('button', { name: /Cancel|Close/i });
      await expect(cancelButton).toBeVisible();

      // Check for a key input field, e.g., a product name or BOM identifier field
      // Using a generic label-based selector for robustness
      const bomNameInput = page.getByLabel(/BOM Name|Product Name|Identifier/i);
      await expect(bomNameInput).toBeVisible();
    });
    
    // 4. Robustness: Check for a specific section or data display area
    await test.step('Verify presence of a data display or form section', async () => {
      // Check for a section that likely contains the list of components in the BOM
      const componentsSection = page.getByRole('region', { name: /Components|Items|Details/i });
      await expect(componentsSection).toBeVisible();
    });
  });
});
