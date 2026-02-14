import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load the application within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for the app to be fully loaded
    await expect(page.getByRole('heading', { name: /e-watch/i })).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Application should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should render event registration form quickly', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    // Navigate to event registration
    const registrationButton = page.getByRole('button', { name: /register/i });
    if (await registrationButton.isVisible()) {
      await registrationButton.click();
    }
    
    // Wait for form to be visible
    await expect(page.locator('input[name="eventName"], input[placeholder*="event" i]').first()).toBeVisible();
    
    const renderTime = Date.now() - startTime;
    
    // Form should render within 1 second
    expect(renderTime).toBeLessThan(1000);
  });

  test('should handle rapid input changes without lag', async ({ page }) => {
    await page.goto('/');
    
    // Find and interact with any text input
    const input = page.locator('input[type="text"]').first();
    
    if (await input.isVisible()) {
      const startTime = Date.now();
      
      // Rapidly type characters
      await input.fill('T');
      await input.fill('Te');
      await input.fill('Tes');
      await input.fill('Test');
      
      const inputTime = Date.now() - startTime;
      
      // Should handle rapid input within 500ms
      expect(inputTime).toBeLessThan(500);
      
      // Verify final value
      await expect(input).toHaveValue('Test');
    }
  });

  test('should efficiently handle multiple component renders', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    // Interact with multiple elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // Verify all buttons are accessible
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      await expect(buttons.nth(i)).toBeVisible();
    }
    
    const checkTime = Date.now() - startTime;
    
    // Should check multiple elements within 2 seconds
    expect(checkTime).toBeLessThan(2000);
  });

  test('should maintain performance with long text input', async ({ page }) => {
    await page.goto('/');
    
    const textarea = page.locator('textarea').first();
    
    if (await textarea.isVisible()) {
      const longText = 'A'.repeat(500);
      
      const startTime = Date.now();
      await textarea.fill(longText);
      const fillTime = Date.now() - startTime;
      
      // Should handle long text within 1 second
      expect(fillTime).toBeLessThan(1000);
      
      // Verify text was filled correctly
      const value = await textarea.inputValue();
      expect(value.length).toBe(500);
    }
  });

  test('should have minimal memory footprint on initial load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to be fully loaded
    await expect(page.getByRole('heading', { name: /e-watch/i })).toBeVisible();
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perf = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      
      return {
        navigation: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming,
        memory: perf.memory
      };
    });
    
    // Check load time metrics
    const loadTime = metrics.navigation.loadEventEnd - metrics.navigation.fetchStart;
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
    
    // If memory API is available, check memory usage
    if (metrics.memory) {
      const memoryUsageMB = metrics.memory.usedJSHeapSize / (1024 * 1024);
      expect(memoryUsageMB).toBeLessThan(50); // Less than 50MB
    }
  });
});
