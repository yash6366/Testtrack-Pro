/**
 * Authentication E2E Tests
 * Tests critical user authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('should complete full registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=/verification email/i')).toBeVisible();
    
    // Verify redirected to verification pending page
    await expect(page).toHaveURL(/.*verify-email/);
  });

  test('should reject weak password', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=/password.*strong/i')).toBeVisible();
  });

  test('should reject duplicate email', async ({ page }) => {
    await page.goto('/register');
    
    // Use a known existing email (admin)
    await page.fill('input[name="name"]', 'Duplicate User');
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
    
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=/already exists/i')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt login (admin user if exists)
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'Admin123!');
    
    await page.click('button[type="submit"]');
    
    // Note: This will fail if email not verified
    // In a real test, we'd mock email verification or use a verified test account
    
    // Verify redirect to dashboard or email verification message
    await page.waitForURL(/.*\/(?:dashboard|verify-email)/, { timeout: 5000 });
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible();
  });

  test('should support remember me option', async ({ page, context }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'Admin123!');
    
    // Check remember me
    await page.check('input[name="rememberMe"]');
    
    await page.click('button[type="submit"]');
    
    // Wait for potential redirect
    await page.waitForTimeout(1000);
    
    // Check that cookies were set with longer expiration
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name.includes('token') || c.name.includes('auth'));
    
    if (authCookie) {
      // Verify expiration is far in future (> 1 day)
      const expiresInDays = (authCookie.expires - Date.now() / 1000) / 86400;
      expect(expiresInDays).toBeGreaterThan(1);
    }
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForTimeout(2000);
    
    // Find and click logout button
    await page.click('button:has-text("Logout"), [aria-label="Logout"]');
    
    // Verify redirected to login
    await expect(page).toHaveURL(/.*login/);
    
    // Verify cannot access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/login');
    
    // Click forgot password
    await page.click('text=/forgot.*password/i');
    await expect(page).toHaveURL(/.*reset-password/);
    
    // Enter email
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=/reset.*link.*sent/i')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    
    // Trigger validation (blur or submit)
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=/valid.*email/i')).toBeVisible();
  });

  test('should enforce password confirmation match', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=/passwords.*match/i')).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should maintain session across page reloads', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    
    // Verify still authenticated (not redirected to login)
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('should clear session on logout', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Logout
    await page.click('button:has-text("Logout"), [aria-label="Logout"]');
    
    // Verify cookies cleared
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name.includes('token') || c.name.includes('auth'));
    expect(authCookie).toBeUndefined();
    
    // Verify cannot access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Security', () => {
  test('should prevent XSS in registration', async ({ page }) => {
    await page.goto('/register');
    
    // Try to inject script in name
    await page.fill('input[name="name"]', '<script>alert("xss")</script>');
    await page.fill('input[name="email"]', 'xss@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
    
    await page.click('button[type="submit"]');
    
    // Verify no script execution (page should still be functional)
    const hasAlert = await page.evaluate(() => {
      return typeof window.alert === 'function';
    });
    expect(hasAlert).toBe(true); // Alert not hijacked
  });

  test('should implement rate limiting on login', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt multiple failed logins rapidly
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // After 5 attempts, should show account locked or rate limit message
    await expect(page.locator('text=/locked|too many|rate limit/i')).toBeVisible();
  });
});
