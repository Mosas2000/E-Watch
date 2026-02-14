import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('should display consistent layout across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Verify main heading is visible
    const heading = page.getByRole('heading', { name: /e-watch/i });
    await expect(heading).toBeVisible();
    
    // Take screenshot for visual regression (browser-specific)
    await page.screenshot({ 
      path: `test-results/layout-${browserName}.png`,
      fullPage: true 
    });
    
    // Verify key elements are present
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('should handle wallet connection UI consistently', async ({ page }) => {
    await page.goto('/');
    
    // Look for wallet connect button
    const connectButton = page.locator('button').filter({ hasText: /connect|wallet/i });
    
    if (await connectButton.count() > 0) {
      await expect(connectButton.first()).toBeVisible();
      await expect(connectButton.first()).toBeEnabled();
      
      // Verify button styling is applied
      const button = connectButton.first();
      const bgColor = await button.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have a background color set (not transparent)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should render forms correctly in all browsers', async ({ page }) => {
    await page.goto('/');
    
    // Check for any input elements
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      // Verify first input is properly styled and functional
      const firstInput = inputs.first();
      await expect(firstInput).toBeVisible();
      
      // Test input interaction
      await firstInput.click();
      await firstInput.fill('Test input');
      await expect(firstInput).toHaveValue('Test input');
      
      // Verify input has proper border/outline
      const borderStyle = await firstInput.evaluate((el) => 
        window.getComputedStyle(el).borderStyle
      );
      expect(borderStyle).not.toBe('none');
    }
  });

  test('should maintain responsive design across viewports', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /e-watch/i })).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /e-watch/i })).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: /e-watch/i })).toBeVisible();
  });

  test('should handle CSS animations consistently', async ({ page }) => {
    await page.goto('/');
    
    // Find any animated elements (buttons, cards, etc.)
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
    
    if (await animatedElements.count() > 0) {
      const firstAnimated = animatedElements.first();
      
      // Verify element is visible
      await expect(firstAnimated).toBeVisible();
      
      // Check transition properties are set
      const transition = await firstAnimated.evaluate((el) => 
        window.getComputedStyle(el).transition
      );
      
      // Should have transition or animation defined
      expect(transition).not.toBe('all 0s ease 0s');
    }
  });

  test('should support standard web APIs', async ({ page }) => {
    await page.goto('/');
    
    // Verify essential browser APIs are available
    const apiSupport = await page.evaluate(() => {
      return {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promise: typeof Promise !== 'undefined',
        asyncAwait: true, // If this code runs, async/await is supported
      };
    });
    
    expect(apiSupport.localStorage).toBe(true);
    expect(apiSupport.sessionStorage).toBe(true);
    expect(apiSupport.fetch).toBe(true);
    expect(apiSupport.promise).toBe(true);
    expect(apiSupport.asyncAwait).toBe(true);
  });

  test('should handle JavaScript features consistently', async ({ page }) => {
    await page.goto('/');
    
    // Test modern JavaScript features
    const featuresSupport = await page.evaluate(() => {
      try {
        // Test arrow functions
        const arrow = () => true;
        
        // Test template literals
        const template = `test ${1 + 1}`;
        
        // Test destructuring
        const { a } = { a: 1 };
        
        // Test spread operator
        const arr = [...[1, 2, 3]];
        
        // Test optional chaining
        const optional = { b: 1 }?.b;
        
        return {
          arrow: arrow(),
          template: template === 'test 2',
          destructuring: a === 1,
          spread: arr.length === 3,
          optional: optional === 1
        };
      } catch (e) {
        return { error: String(e) };
      }
    });
    
    expect(featuresSupport.arrow).toBe(true);
    expect(featuresSupport.template).toBe(true);
    expect(featuresSupport.destructuring).toBe(true);
    expect(featuresSupport.spread).toBe(true);
  });
});
