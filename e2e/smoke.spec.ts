import { test, expect } from '@playwright/test';

/**
 * Basic smoke tests to verify application loads correctly
 */
test.describe('Application Smoke Tests', () => {
  
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify page title
    await expect(page).toHaveTitle(/E-Watch/i);
    
    // Verify main heading is visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('E-Watch');
  });

  test('should display wallet connect button', async ({ page }) => {
    await page.goto('/');
    
    // Check for wallet connect button
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should display event registration section', async ({ page }) => {
    await page.goto('/');
    
    // Verify event registration heading
    const registrationHeading = page.locator('h2').filter({ hasText: /register new event/i });
    await expect(registrationHeading).toBeVisible();
  });

  test('should display event dashboard section', async ({ page }) => {
    await page.goto('/');
    
    // Verify dashboard heading
    const dashboardHeading = page.locator('h2').filter({ hasText: /event dashboard/i });
    await expect(dashboardHeading).toBeVisible();
  });

  test('should have responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verify page still loads on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
  });
});
