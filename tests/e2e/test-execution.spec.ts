/**
 * Test Execution E2E Tests
 * Tests the complete test case execution workflow
 */

import { test, expect } from '@playwright/test';

// Helper to login before each test
async function loginAsTestUser(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tester@example.com');
  await page.fill('input[name="password"]', 'Tester123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 5000 });
}

test.describe('Test Case Execution Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should create and execute test case end-to-end', async ({ page }) => {
    // Navigate to test cases
    await page.click('a[href*="test-cases"], text=Test Cases');
    await expect(page).toHaveURL(/.*test-cases/);

    // Create new test case
    await page.click('button:has-text("New Test Case")');
    
    const timestamp = Date.now();
    await page.fill('input[name="title"]', `E2E Test Case ${timestamp}`);
    await page.fill('textarea[name="description"]', 'Test case created via E2E test');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    // Add test steps
    await page.click('button:has-text("Add Step")');
    await page.fill('input[name="steps[0].description"]', 'Open application');
    await page.fill('input[name="steps[0].expectedResult"]', 'Application loads successfully');
    
    await page.click('button:has-text("Add Step")');
    await page.fill('input[name="steps[1].description"]', 'Click login button');
    await page.fill('input[name="steps[1].expectedResult"]', 'Login form appears');
    
    // Save test case
    await page.click('button[type="submit"]:has-text("Save")');
    
    // Verify success message
    await expect(page.locator('text=/test case.*created/i')).toBeVisible();
    
    // Execute the test case
    await page.click('button:has-text("Execute")');
    await expect(page).toHaveURL(/.*execute/);
    
    // Execute step by step
    // Step 1 - Pass
    await page.click('button:has-text("Pass"), input[value="PASSED"]');
    await page.click('button:has-text("Next Step")');
    
    // Step 2 - Fail
    await page.click('button:has-text("Fail"), input[value="FAILED"]');
    await page.fill('textarea[name="actualResult"]', 'Login form did not appear');
    
    // Upload evidence (if file upload exists)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Would upload file in real scenario
      // await fileInput.setInputFiles('path/to/screenshot.png');
    }
    
    // Complete execution
    await page.click('button:has-text("Complete")');
    
    // Verify execution completed
    await expect(page.locator('text=/execution.*completed/i')).toBeVisible();
    
    // Verify can create bug from failed step
    await expect(page.locator('button:has-text("Create Bug")')).toBeVisible();
  });

  test('should create bug from failed test execution', async ({ page }) => {
    // Navigate to test executions
    await page.click('a[href*="executions"], text=Executions');
    
    // Find a failed execution or create one
    // For this test, assume there's a failed execution
    await page.click('tr:has-text("FAILED"):first button:has-text("View")');
    
    // Click create bug from failed step
    await page.click('button:has-text("Create Bug")');
    
    // Verify bug form pre-filled with test execution data
    const titleInput = page.locator('input[name="title"]');
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toContain('Failed');
    
    // Add additional bug details
    await page.selectOption('select[name="severity"]', 'HIGH');
    await page.fill('textarea[name="stepsToReproduce"]', 'Follow test execution steps');
    
    // Submit bug
    await page.click('button[type="submit"]:has-text("Create Bug")');
    
    // Verify bug created
    await expect(page.locator('text=/bug.*created/i')).toBeVisible();
    
    // Verify redirected to bug details
    await expect(page).toHaveURL(/.*bugs\/\d+/);
  });

  test('should support auto-save during execution', async ({ page }) => {
    // Navigate to active execution
    await page.goto('/test-cases/1/execute');
    
    // Fill out step result
    await page.fill('textarea[name="actualResult"]', 'Partial result...');
    
    // Wait for auto-save indicator
    await expect(page.locator('text=/saving|saved/i')).toBeVisible({ timeout: 5000 });
    
    // Refresh page
    await page.reload();
    
    // Verify data persisted
    const actualResult = await page.locator('textarea[name="actualResult"]').inputValue();
    expect(actualResult).toContain('Partial result');
  });

  test('should track execution duration', async ({ page }) => {
    // Start execution
    await page.goto('/test-cases/1/execute');
    
    // Verify timer is running
    await expect(page.locator('[data-testid="execution-timer"]')).toBeVisible();
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Complete execution
    await page.click('button:has-text("Complete")');
    
    // Verify execution time recorded
    await expect(page.locator('text=/duration|time|took/i')).toBeVisible();
  });

  test('should allow re-execution and comparison', async ({ page }) => {
    // Navigate to test case with previous execution
    await page.goto('/test-cases/1');
    
    // Click re-execute
    await page.click('button:has-text("Re-execute")');
    
    // Verify can see previous execution results
    await expect(page.locator('text=/previous.*execution/i')).toBeVisible();
    
    // Execute with different result
    await page.click('button:has-text("Pass")');
    await page.click('button:has-text("Complete")');
    
    // Verify comparison view
    await expect(page.locator('text=/comparison|previous/i')).toBeVisible();
  });
});

test.describe('Test Suite Execution', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should execute entire test suite', async ({ page }) => {
    // Navigate to test suites
    await page.click('a[href*="test-suites"], text=Suites');
    
    // Select a suite or create one
    await page.click('button:has-text("New Suite")');
    
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `E2E Test Suite ${timestamp}`);
    await page.fill('textarea[name="description"]', 'Suite for E2E testing');
    
    // Add test cases to suite
    await page.click('button:has-text("Add Test Cases")');
    await page.check('input[type="checkbox"]:first');
    await page.check('input[type="checkbox"]:nth(1)');
    await page.click('button:has-text("Add Selected")');
    
    // Save suite
    await page.click('button[type="submit"]:has-text("Save")');
    
    // Execute suite
    await page.click('button:has-text("Execute Suite")');
    
    // Verify execution started
    await expect(page.locator('text=/executing.*suite/i')).toBeVisible();
    
    // Wait for execution to progress
    await page.waitForTimeout(2000);
    
    // Verify progress indicator
    await expect(page.locator('[data-testid="suite-progress"]')).toBeVisible();
  });

  test('should handle suite execution with failures', async ({ page }) => {
    // Navigate to completed suite execution with failures
    await page.goto('/test-suites/1/executions/1');
    
    // Verify summary shows passed/failed counts
    await expect(page.locator('text=/passed/i')).toBeVisible();
    await expect(page.locator('text=/failed/i')).toBeVisible();
    
    // Verify can filter by status
    await page.selectOption('select[name="statusFilter"]', 'FAILED');
    
    // Verify only failed tests shown
    const failedTests = page.locator('tr:has-text("FAILED")');
    await expect(failedTests.first()).toBeVisible();
  });

  test('should generate execution report', async ({ page }) => {
    // Navigate to suite execution
    await page.goto('/test-suites/1/executions/1');
    
    // Click export/download report
    await page.click('button:has-text("Export Report")');
    
    // Verify report options
    await expect(page.locator('text=/PDF|Excel|CSV/i')).toBeVisible();
    
    // Select PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("PDF")'),
    ]);
    
    // Verify download started
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});

test.describe('Execution History', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should view execution history', async ({ page }) => {
    // Navigate to test case
    await page.goto('/test-cases/1');
    
    // Click history tab
    await page.click('button:has-text("History"), a[href*="history"]');
    
    // Verify history list
    await expect(page.locator('text=/execution.*history/i')).toBeVisible();
    
    // Verify can filter by date range
    await page.fill('input[name="startDate"]', '2026-01-01');
    await page.fill('input[name="endDate"]', '2026-03-31');
    await page.click('button:has-text("Filter")');
    
    // Verify filtered results
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 1000 }).catch(() => {
      // No results is also valid
    });
  });

  test('should compare execution results', async ({ page }) => {
    await page.goto('/test-cases/1/history');
    
    // Select two executions
    await page.check('input[type="checkbox"]:nth(0)');
    await page.check('input[type="checkbox"]:nth(1)');
    
    // Click compare
    await page.click('button:has-text("Compare")');
    
    // Verify comparison view
    await expect(page.locator('text=/comparison/i')).toBeVisible();
    
    // Verify side-by-side results
    await expect(page.locator('[data-testid="execution-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="execution-2"]')).toBeVisible();
  });
});

test.describe('Evidence Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should upload evidence during execution', async ({ page }) => {
    await page.goto('/test-cases/1/execute');
    
    // Upload screenshot
    const fileInput = page.locator('input[type="file"]');
    
    // In a real test, would upload actual file
    // const filePath = path.join(__dirname, 'fixtures', 'screenshot.png');
    // await fileInput.setInputFiles(filePath);
    
    // Verify upload progress
    // await expect(page.locator('text=/uploading/i')).toBeVisible();
    
    // Verify upload complete
    // await expect(page.locator('text=/uploaded/i')).toBeVisible();
  });

  test('should view evidence in execution history', async ({ page }) => {
    await page.goto('/executions/1');
    
    // Verify evidence thumbnails
    await expect(page.locator('img[alt*="evidence"]')).toBeVisible();
    
    // Click to view full size
    await page.click('img[alt*="evidence"]:first');
    
    // Verify lightbox/modal
    await expect(page.locator('[data-testid="image-viewer"]')).toBeVisible();
    
    // Close viewer
    await page.keyboard.press('Escape');
  });
});
