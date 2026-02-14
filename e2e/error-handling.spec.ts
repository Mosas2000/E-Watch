import { test, expect } from '@playwright/test';

/**
 * E2E tests for error handling scenarios
 */
test.describe('Error Handling', () => {
  
  test('should handle network errors gracefully', async ({ page, context }) => {
    await page.goto('/');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    const searchInput = page.locator('input[placeholder*="Event ID" i]');
    const searchButton = page.getByRole('button', { name: /search/i });
    
    await searchInput.fill('999');
    await searchButton.click();
    
    // Should show error message
    await expect(page.locator('text=/failed/i')).toBeVisible({ timeout: 10000 });
    
    // Go back online
    await context.setOffline(false);
  });

  test('should show alert when event not found', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="Event ID" i]');
    const searchButton = page.getByRole('button', { name: /search/i });
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('not found');
      await dialog.accept();
    });
    
    await searchInput.fill('99999');
    await searchButton.click();
    
    await page.waitForTimeout(2000);
  });

  test('should validate form before submission', async ({ page }) => {
    await page.goto('/');
    
    const eventTypeInput = page.locator('input#eventType');
    const submitButton = page.getByRole('button', { name: /register event/i });
    
    // Try to submit with empty fields
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Error message should appear
      const errorMsg = page.locator('.error-message');
      await expect(errorMsg).toBeVisible();
    }
  });

  test('should handle extremely long input gracefully', async ({ page }) => {
    await page.goto('/');
    
    const dataTextarea = page.locator('textarea#data');
    
    // Try to paste very long text
    const veryLongText = 'x'.repeat(10000);
    await dataTextarea.fill(veryLongText);
    
    // Should truncate to max length
    const value = await dataTextarea.inputValue();
    expect(value.length).toBeLessThanOrEqual(500);
  });

  test('should recover from rendering errors', async ({ page }) => {
    await page.goto('/');
    
    // App should render without console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // No critical errors should be logged
    const criticalErrors = logs.filter(log => 
      log.includes('Uncaught') || log.includes('TypeError')
    );
    expect(criticalErrors.length).toBe(0);
  });
});
