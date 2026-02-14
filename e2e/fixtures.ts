import { test as base, expect } from '@playwright/test';

/**
 * Test fixtures and helper functions
 */

// Custom fixture for authenticated user
export const test = base.extend({
  authenticatedPage: async ({ page, context }, use) => {
    // Mock wallet authentication
    await context.addInitScript(() => {
      localStorage.setItem('mockWalletConnected', 'true');
      localStorage.setItem('mockWalletAddress', 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');
    });
    
    await page.goto('/');
    await use(page);
  },
});

/**
 * Helper function to wait for network idle
 */
export async function waitForNetworkIdle(page: any, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Helper function to fill event registration form
 */
export async function fillEventForm(page: any, eventType: string, data: string) {
  const eventTypeInput = page.locator('input#eventType');
  const dataTextarea = page.locator('textarea#data');
  
  await eventTypeInput.fill(eventType);
  await dataTextarea.fill(data);
}

/**
 * Helper function to search for an event
 */
export async function searchEvent(page: any, eventId: number) {
  const searchInput = page.locator('input[placeholder*="Event ID" i]');
  const searchButton = page.getByRole('button', { name: /search/i });
  
  await searchInput.fill(eventId.toString());
  await searchButton.click();
}

/**
 * Helper to check if element is in viewport
 */
export async function isInViewport(page: any, selector: string): Promise<boolean> {
  return await page.evaluate((sel: string) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

export { expect };
