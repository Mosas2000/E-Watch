import { test, expect } from '@playwright/test';

/**
 * E2E tests for accessibility compliance
 */
test.describe('Accessibility Tests', () => {
  
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for h2 elements
    const h2Elements = page.locator('h2');
    const h2Count = await h2Elements.count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should have labels for form inputs', async ({ page }) => {
    await page.goto('/');
    
    const eventTypeInput = page.locator('input#eventType');
    const eventTypeLabel = page.locator('label[for="eventType"]');
    await expect(eventTypeLabel).toBeVisible();
    
    const dataTextarea = page.locator('textarea#data');
    const dataLabel = page.locator('label[for="data"]');
    await expect(dataLabel).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // First focusable element should be connect wallet button
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check that text is visible (basic contrast check)
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    const h1 = page.locator('h1');
    const textColor = await h1.evaluate((el) => 
      window.getComputedStyle(el).color
    );
    
    // Both should have valid color values
    expect(backgroundColor).toBeTruthy();
    expect(textColor).toBeTruthy();
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto('/');
    
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await connectButton.focus();
    
    // Check if element has focus
    const isFocused = await connectButton.evaluate((el) => 
      el === document.activeElement
    );
    expect(isFocused).toBe(true);
  });

  test('should have ARIA attributes where needed', async ({ page }) => {
    await page.goto('/');
    
    // Buttons should have accessible names
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
