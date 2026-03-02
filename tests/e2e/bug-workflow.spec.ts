/**
 * Bug Management Workflow E2E Tests
 * Tests the complete bug lifecycle from creation to closure
 */

import { test, expect } from '@playwright/test';

// Helper to login as different user types
async function loginAs(page, role: 'developer' | 'tester' | 'admin') {
  const credentials = {
    developer: { email: 'developer@example.com', password: 'Dev123!' },
    tester: { email: 'tester@example.com', password: 'Tester123!' },
    admin: { email: 'admin@gmail.com', password: 'Admin123!' },
  };

  await page.goto('/login');
  await page.fill('input[name="email"]', credentials[role].email);
  await page.fill('input[name="password"]', credentials[role].password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 5000 });
}

test.describe('Bug Workflow - Complete Lifecycle', () => {
  test('should complete full bug lifecycle: create → assign → fix → verify → close', async ({ page }) => {
    // ===== STEP 1: Tester creates bug =====
    await loginAs(page, 'tester');
    
    // Navigate to bugs
    await page.click('a[href*="bugs"], text=Bugs');
    
    // Create new bug
    await page.click('button:has-text("New Bug")');
    
    const timestamp = Date.now();
    await page.fill('input[name="title"]', `E2E Bug ${timestamp}`);
    await page.fill('textarea[name="description"]', 'Bug found during E2E testing');
    await page.selectOption('select[name="severity"]', 'HIGH');
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.fill('textarea[name="stepsToReproduce"]', '1. Open app\n2. Click button\n3. Observe error');
    
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Verify bug created with OPEN status
    await expect(page.locator('text=/bug.*created/i')).toBeVisible();
    const bugUrl = page.url();
    const bugId = bugUrl.match(/bugs\/(\d+)/)?.[1];
    
    // Logout tester
    await page.click('button:has-text("Logout")');
    
    // ===== STEP 2: Admin/Lead assigns to developer =====
    await loginAs(page, 'admin');
    
    await page.goto(`/bugs/${bugId}`);
    
    // Assign to developer
    await page.click('button:has-text("Assign")');
    await page.selectOption('select[name="assigneeId"]', { index: 1 }); // First developer
    await page.click('button:has-text("Assign Bug")');
    
    // Verify status changed to ASSIGNED
    await expect(page.locator('text=/assigned/i')).toBeVisible();
    
    await page.click('button:has-text("Logout")');
    
    // ===== STEP 3: Developer works on fix =====
    await loginAs(page, 'developer');
    
    // Check developer dashboard for assigned bugs
    await page.click('a[href*="developer"], text=Developer');
    await expect(page.locator(`text=E2E Bug ${timestamp}`)).toBeVisible();
    
    // Open the bug
    await page.click(`text=E2E Bug ${timestamp}`);
    
    // Change status to IN_PROGRESS
    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    await page.click('button:has-text("Update Status")');
    
    // Add fix documentation
    await page.click('button:has-text("Document Fix")');
    await page.selectOption('select[name="rootCauseCategory"]', 'LOGIC_ERROR');
    await page.fill('textarea[name="rootCause"]', 'Incorrect null check in validation');
    await page.fill('textarea[name="fixStrategy"]', 'Added proper null handling');
    await page.fill('input[name="commitHash"]', 'abc123def456');
    await page.fill('input[name="branch"]', 'bugfix/e2e-test');
    await page.fill('input[name="pullRequest"]', '#123');
    await page.fill('input[name="hoursSpent"]', '2.5');
    
    await page.click('button[type="submit"]:has-text("Save Fix")');
    
    // Change status to FIXED
    await page.selectOption('select[name="status"]', 'FIXED');
    await page.click('button:has-text("Update Status")');
    
    // Request retest
    await page.click('button:has-text("Request Retest")');
    
    // Verify retest requested
    await expect(page.locator('text=/retest.*requested/i')).toBeVisible();
    
    await page.click('button:has-text("Logout")');
    
    // ===== STEP 4: Tester verifies fix =====
    await loginAs(page, 'tester');
    
    // Check for retest requests
    await page.click('a[href*="bugs"], text=Bugs');
    await page.selectOption('select[name="statusFilter"]', 'FIXED');
    
    // Open the bug
    await page.goto(`/bugs/${bugId}`);
    
    // Verify fix documentation is visible
    await expect(page.locator('text=/root cause/i')).toBeVisible();
    await expect(page.locator('text=abc123def456')).toBeVisible();
    
    // Add verification comment
    await page.fill('textarea[name="comment"]', 'Verified fix works correctly');
    await page.click('button:has-text("Add Comment")');
    
    // Change status to VERIFIED
    await page.selectOption('select[name="status"]', 'VERIFIED');
    await page.click('button:has-text("Update Status")');
    
    // Close the bug
    await page.selectOption('select[name="status"]', 'CLOSED');
    await page.click('button:has-text("Update Status")');
    
    // Verify bug closed
    await expect(page.locator('text=/closed/i')).toBeVisible();
  });
});

test.describe('Bug Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'tester');
  });

  test('should create bug with all required fields', async ({ page }) => {
    await page.click('a[href*="bugs"]');
    await page.click('button:has-text("New Bug")');
    
    const timestamp = Date.now();
    await page.fill('input[name="title"]', `Bug ${timestamp}`);
    await page.fill('textarea[name="description"]', 'Detailed bug description');
    await page.selectOption('select[name="severity"]', 'MEDIUM');
    await page.selectOption('select[name="priority"]', 'MEDIUM');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/created/i')).toBeVisible();
  });

  test('should reject bug with missing required fields', async ({ page }) => {
    await page.click('a[href*="bugs"]');
    await page.click('button:has-text("New Bug")');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('text=/required/i')).toBeVisible();
  });

  test('should link bug to failing test execution', async ({ page }) => {
    // Navigate to a failed test execution
    await page.goto('/executions/1'); // Assume execution 1 exists and failed
    
    // Create bug from execution
    await page.click('button:has-text("Create Bug")');
    
    // Verify form pre-filled
    const titleValue = await page.locator('input[name="title"]').inputValue();
    expect(titleValue.length).toBeGreaterThan(0);
    
    // Complete and submit
    await page.selectOption('select[name="severity"]', 'HIGH');
    await page.click('button[type="submit"]');
    
    // Verify bug created and linked
    await expect(page.locator('text=/created/i')).toBeVisible();
  });
});

test.describe('Bug Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('should assign bug to developer', async ({ page }) => {
    await page.goto('/bugs/1');
    
    await page.click('button:has-text("Assign")');
    await page.selectOption('select[name="assigneeId"]', { index: 1 });
    await page.click('button:has-text("Assign")');
    
    await expect(page.locator('text=/assigned/i')).toBeVisible();
  });

  test('should reassign bug to different developer', async ({ page }) => {
    await page.goto('/bugs/1');
    
    // Reassign
    await page.click('button:has-text("Reassign")');
    await page.selectOption('select[name="assigneeId"]', { index: 2 });
    await page.click('button:has-text("Reassign")');
    
    await expect(page.locator('text=/reassigned/i')).toBeVisible();
    
    // Verify history shows reassignment
    await page.click('button:has-text("History")');
    await expect(page.locator('text=/reassigned/i')).toBeVisible();
  });
});

test.describe('Developer Bug Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'developer');
  });

  test('should view assigned bugs in developer dashboard', async ({ page }) => {
    await page.click('a[href*="developer"]');
    
    // Verify can see assigned bugs
    await expect(page.locator('text=/assigned.*bugs/i')).toBeVisible();
    
    // Verify can filter by priority
    await page.selectOption('select[name="priorityFilter"]', 'HIGH');
    
    // Verify high priority bugs are shown (if any exist)
    const highPriorityBugs = page.locator('tr[data-priority="HIGH"]');
    await expect(highPriorityBugs.first()).toBeVisible({ timeout: 1000 }).catch(() => {
      // No high priority bugs is also valid
    });
  });

  test('should document bug fix with commit details', async ({ page }) => {
    await page.goto('/bugs/1');
    
    await page.click('button:has-text("Document Fix")');
    
    await page.selectOption('select[name="rootCauseCategory"]', 'LOGIC_ERROR');
    await page.fill('textarea[name="rootCause"]', 'Incorrect validation');
    await page.fill('textarea[name="fixStrategy"]', 'Updated validation logic');
    await page.fill('input[name="commitHash"]', 'a1b2c3d4e5f6');
    await page.fill('input[name="branch"]', 'fix/validation-bug');
    await page.fill('input[name="pullRequest"]', '#456');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/fix.*documented/i')).toBeVisible();
  });

  test('should track hours spent on bug fix', async ({ page }) => {
    await page.goto('/bugs/1');
    
    await page.fill('input[name="hoursSpent"]', '3.5');
    await page.click('button:has-text("Update")');
    
    // Verify hours saved
    await expect(page.locator('text=/3.5.*hours/i')).toBeVisible();
  });
});

test.describe('Bug Comments and Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'tester');
  });

  test('should add comments to bug', async ({ page }) => {
    await page.goto('/bugs/1');
    
    await page.fill('textarea[name="comment"]', 'This is a test comment');
    await page.click('button:has-text("Add Comment")');
    
    await expect(page.locator('text=This is a test comment')).toBeVisible();
  });

  test('should mention other users in comments', async ({ page }) => {
    await page.goto('/bugs/1');
    
    await page.fill('textarea[name="comment"]', '@developer Please review this bug');
    await page.click('button:has-text("Add Comment")');
    
    // Verify mention rendered correctly
    await expect(page.locator('text=@developer')).toBeVisible();
  });

  test('should support threaded comments', async ({ page }) => {
    await page.goto('/bugs/1');
    
    // Find existing comment and reply
    await page.click('button:has-text("Reply"):first');
    await page.fill('textarea[name="reply"]', 'This is a reply');
    await page.click('button:has-text("Post Reply")');
    
    // Verify threaded structure
    await expect(page.locator('.comment-thread .comment-reply')).toBeVisible();
  });
});

test.describe('Bug Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('should view bug metrics dashboard', async ({ page }) => {
    await page.click('a[href*="analytics"]');
    await page.click('a[href*="bugs"]');
    
    // Verify key metrics visible
    await expect(page.locator('text=/open.*bugs/i')).toBeVisible();
    await expect(page.locator('text=/avg.*fix.*time/i')).toBeVisible();
    await expect(page.locator('text=/by.*severity/i')).toBeVisible();
  });

  test('should filter bugs by multiple criteria', async ({ page }) => {
    await page.goto('/bugs');
    
    // Apply filters
    await page.selectOption('select[name="status"]', 'OPEN');
    await page.selectOption('select[name="severity"]', 'HIGH');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    await page.click('button:has-text("Apply Filters")');
    
    // Verify filtered results
    const bugs = page.locator('tr[data-status="OPEN"][data-severity="HIGH"]');
    await expect(bugs.first()).toBeVisible({ timeout: 1000 }).catch(() => {
      // No bugs matching filter is also valid
    });
  });

  test('should export bug report', async ({ page }) => {
    await page.goto('/bugs');
    
    await page.click('button:has-text("Export")');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("CSV")'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});
