import { test, expect } from '@playwright/test';

/**
 * E2E tests for event dashboard functionality
 */
test.describe('Event Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display event dashboard section', async ({ page }) => {
    const heading = page.locator('h2').filter({ hasText: /event dashboard/i });
    await expect(heading).toBeVisible();
  });

  test('should show total events count', async ({ page }) => {
    const statsSection = page.locator('.dashboard-stats');
    await expect(statsSection).toBeVisible();
    
    const totalEvents = page.locator('text=/total events:/i');
    await expect(totalEvents).toBeVisible();
  });

  test('should display event search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Event ID" i]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('type', 'number');
  });

  test('should display search button', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /search/i });
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();
  });

  test('should display filter dropdown', async ({ page }) => {
    const filterSelect = page.locator('select');
    await expect(filterSelect).toBeVisible();
    
    // Verify filter options
    await expect(filterSelect).toContainText('All Events');
    await expect(filterSelect).toContainText('Active Only');
    await expect(filterSelect).toContainText('Inactive Only');
  });

  test('should show placeholder text when no events', async ({ page }) => {
    const placeholder = page.locator('text=/no events to display/i');
    await expect(placeholder).toBeVisible();
  });

  test('should update search input value', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Event ID" i]');
    
    await searchInput.fill('123');
    await expect(searchInput).toHaveValue('123');
  });

  test('should disable search button while loading', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Event ID" i]');
    const searchButton = page.getByRole('button', { name: /search/i });
    
    await searchInput.fill('0');
    await searchButton.click();
    
    // Button should show loading state briefly
    await expect(searchButton).toContainText(/searching/i);
  });

  test('should change filter selection', async ({ page }) => {
    const filterSelect = page.locator('select');
    
    await filterSelect.selectOption('active');
    await expect(filterSelect).toHaveValue('active');
    
    await filterSelect.selectOption('inactive');
    await expect(filterSelect).toHaveValue('inactive');
    
    await filterSelect.selectOption('all');
    await expect(filterSelect).toHaveValue('all');
  });
});
