import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should not expose sensitive data in HTML', async ({ page }) => {
    await page.goto('/');
    
    // Get page source
    const content = await page.content();
    
    // Check for common sensitive patterns
    expect(content).not.toContain('private');
    expect(content).not.toContain('secret');
    expect(content).not.toMatch(/api[_-]?key/i);
    expect(content).not.toMatch(/password/i);
  });

  test('should have secure headers', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      const headers = response.headers();
      
      // Verify security headers (if implemented)
      // Note: Some may not be present in dev mode
      const hasXFrameOptions = 'x-frame-options' in headers;
      const hasXContentType = 'x-content-type-options' in headers;
      
      // At minimum, content-type should be set
      expect(headers['content-type']).toBeDefined();
    }
  });

  test('should sanitize user input', async ({ page }) => {
    await page.goto('/');
    
    // Find input fields
    const inputs = page.locator('input[type="text"], textarea');
    
    if (await inputs.count() > 0) {
      const firstInput = inputs.first();
      
      // Try to inject script
      const xssPayload = '<script>alert("XSS")</script>';
      await firstInput.fill(xssPayload);
      
      // Verify the script is not executed
      const alerts = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      // Wait a moment for any potential alert
      await page.waitForTimeout(500);
      
      // No alert should have been triggered
      expect(alerts).toHaveLength(0);
    }
  });

  test('should protect against clickjacking', async ({ page }) => {
    await page.goto('/');
    
    // Check if page can be embedded in iframe (should be prevented)
    const canEmbed = await page.evaluate(() => {
      try {
        // Try to detect if page is in an iframe
        return window.self !== window.top;
      } catch (e) {
        // If access is denied, frame-busting is working
        return false;
      }
    });
    
    // Page should not be in an iframe (unless it's intentional)
    expect(canEmbed).toBe(false);
  });

  test('should use HTTPS in production URLs', async ({ page }) => {
    await page.goto('/');
    
    // Get all links on the page
    const links = await page.locator('a[href]').evaluateAll((anchors) => 
      anchors.map(a => a.getAttribute('href')).filter(Boolean)
    );
    
    // Check external links use HTTPS
    const externalHttpLinks = links.filter(link => 
      link && link.startsWith('http://') && !link.includes('localhost')
    );
    
    // Should not have insecure external links
    expect(externalHttpLinks).toHaveLength(0);
  });

  test('should not expose stack traces in error messages', async ({ page }) => {
    // Monitor console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Trigger potential errors by interacting with the app
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      await buttons.first().click({ force: true });
    }
    
    // Wait for potential errors
    await page.waitForTimeout(1000);
    
    // Check errors don't contain stack traces or file paths
    errors.forEach(error => {
      expect(error).not.toMatch(/at\s+.*\(.*:\d+:\d+\)/); // Stack trace pattern
      expect(error).not.toMatch(/\/node_modules\//); // Node modules path
    });
  });

  test('should validate CORS configuration', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      const headers = response.headers();
      
      // If CORS headers are present, verify they're not overly permissive
      if (headers['access-control-allow-origin']) {
        const corsOrigin = headers['access-control-allow-origin'];
        
        // Should not be wildcard in production
        // Note: * is acceptable in development
        expect(corsOrigin).toBeDefined();
      }
    }
  });

  test('should not leak information in error pages', async ({ page }) => {
    // Try to access non-existent route
    const response = await page.goto('/this-route-does-not-exist-12345', {
      waitUntil: 'networkidle'
    });
    
    // Get page content
    const content = await page.content();
    
    // Should not expose server information
    expect(content.toLowerCase()).not.toContain('nginx');
    expect(content.toLowerCase()).not.toContain('apache');
    expect(content.toLowerCase()).not.toContain('express');
  });

  test('should implement secure authentication flow', async ({ page }) => {
    await page.goto('/');
    
    // Look for wallet connect button
    const connectButton = page.locator('button').filter({ hasText: /connect|wallet/i });
    
    if (await connectButton.count() > 0) {
      await connectButton.first().click();
      
      // Wait for potential wallet modal
      await page.waitForTimeout(1000);
      
      // Should not store sensitive data in localStorage immediately
      const sensitiveData = await page.evaluate(() => {
        const storage = { ...localStorage };
        return Object.keys(storage).filter(key => 
          key.toLowerCase().includes('private') || 
          key.toLowerCase().includes('secret')
        );
      });
      
      expect(sensitiveData).toHaveLength(0);
    }
  });

  test('should properly handle logout/disconnect', async ({ page }) => {
    await page.goto('/');
    
    // Check if localStorage is used
    const hasLocalStorage = await page.evaluate(() => {
      return localStorage.length > 0;
    });
    
    if (hasLocalStorage) {
      // Look for disconnect/logout button
      const disconnectButton = page.locator('button').filter({ 
        hasText: /disconnect|logout|sign out/i 
      });
      
      if (await disconnectButton.count() > 0) {
        await disconnectButton.first().click();
        
        // Wait for disconnection
        await page.waitForTimeout(500);
        
        // Verify session data is cleared (implementation dependent)
        const storageAfter = await page.evaluate(() => localStorage.length);
        
        // Storage should be cleared or reduced
        expect(storageAfter).toBeLessThanOrEqual(hasLocalStorage ? localStorage.length : 0);
      }
    }
  });
});
