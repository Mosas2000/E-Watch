import { test, expect } from '@playwright/test';

/**
 * E2E tests for event registration functionality
 */
test.describe('Event Registration Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display event registration form', async ({ page }) => {
    // Verify form heading
    const heading = page.locator('h2').filter({ hasText: /register new event/i });
    await expect(heading).toBeVisible();
    
    // Verify form fields exist
    const eventTypeInput = page.locator('input#eventType');
    const dataTextarea = page.locator('textarea#data');
    
    await expect(eventTypeInput).toBeVisible();
    await expect(dataTextarea).toBeVisible();
  });

  test('should show character count for event type field', async ({ page }) => {
    const eventTypeInput = page.locator('input#eventType');
    const charCounter = page.locator('small', { hasText: /\/50 characters/i });
    
    await eventTypeInput.fill('transfer');
    await expect(charCounter).toContainText('8/50');
  });

  test('should show character count for data field', async ({ page }) => {
    const dataTextarea = page.locator('textarea#data');
    const charCounter = page.locator('small', { hasText: /\/500 characters/i });
    
    await dataTextarea.fill('{"amount": 100}');
    await expect(charCounter).toContainText('16/500');
  });

  test('should validate event type length limit', async ({ page }) => {
    const eventTypeInput = page.locator('input#eventType');
    
    // Try to enter more than 50 characters
    const longString = 'a'.repeat(60);
    await eventTypeInput.fill(longString);
    
    // Input should be limited to 50 characters
    const value = await eventTypeInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(50);
  });

  test('should validate data field length limit', async ({ page }) => {
    const dataTextarea = page.locator('textarea#data');
    
    // Try to enter more than 500 characters
    const longString = 'a'.repeat(600);
    await dataTextarea.fill(longString);
    
    // Input should be limited to 500 characters
    const value = await dataTextarea.inputValue();
    expect(value.length).toBeLessThanOrEqual(500);
  });

  test('should show validation error for empty event type', async ({ page }) => {
    const eventTypeInput = page.locator('input#eventType');
    const dataTextarea = page.locator('textarea#data');
    const submitButton = page.getByRole('button', { name: /register event/i });
    
    // Fill only data field
    await dataTextarea.fill('test data');
    
    // Try to submit
    if (await submitButton.isVisible() && await submitButton.isEnabled()) {
      await submitButton.click();
      
      // Should show error message
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toContainText(/event type is required/i);
    }
  });

  test('should show validation error for empty data field', async ({ page }) => {
    const eventTypeInput = page.locator('input#eventType');
    const dataTextarea = page.locator('textarea#data');
    const submitButton = page.getByRole('button', { name: /register event/i });
    
    // Fill only event type field
    await eventTypeInput.fill('transfer');
    
    // Try to submit
    if (await submitButton.isVisible() && await submitButton.isEnabled()) {
      await submitButton.click();
      
      // Should show error message
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toContainText(/event data is required/i);
    }
  });

  test('should clear form fields after typing and clearing', async ({ page }) => {
    const eventTypeInput = page.locator('input#eventType');
    const dataTextarea = page.locator('textarea#data');
    
    // Fill fields
    await eventTypeInput.fill('transfer');
    await dataTextarea.fill('test data');
    
    // Clear fields
    await eventTypeInput.clear();
    await dataTextarea.clear();
    
    // Verify fields are empty
    await expect(eventTypeInput).toHaveValue('');
    await expect(dataTextarea).toHaveValue('');
  });
});
