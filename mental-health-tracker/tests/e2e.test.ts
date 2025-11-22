import { test, expect } from '@playwright/test';

test.describe('Mindline - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toContainText('Mindline');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should handle user registration', async ({ page }) => {
    // Try to login with non-existent email
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show registration form
    await expect(page.locator('input[id="name"]')).toBeVisible();
    
    // Complete registration
    await page.fill('input[id="name"]', 'New User');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome back, New User!')).toBeVisible();
  });

  test('should handle user login', async ({ page }) => {
    // Register first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.fill('input[id="name"]', 'Test User');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('button[title="Logout"]');
    await expect(page).toHaveURL(/.*login/);

    // Login again
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome back, Test User!')).toBeVisible();
  });

  test('should submit check-in response', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Submit check-in response
    await page.fill('textarea[placeholder="Share your thoughts and feelings..."]', 'I am feeling good today!');
    await page.click('button:has-text("Submit Response")');

    await expect(page.locator('text=Response recorded successfully!')).toBeVisible();
    await expect(page.locator('textarea')).toHaveText('');
  });

  test('should complete daily assessment', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Already on dashboard, start integrated assessment

    // Q1: journal entry
    await page.fill('textarea', 'A long but meaningful day at work.');
    await page.click('button:has-text("Next")');

    // Q2: emotional theme
    await page.click('button:has-text("😐")');
    await page.click('button:has-text("Next")');

    // Q3: memorable moment
    await page.fill('textarea', 'Had a great conversation with a friend');
    await page.click('button:has-text("Next")');

    // Continue through questions (simplified for test)
    for (let i = 4; i <= 5; i++) {
      if (await page.locator('select').isVisible()) {
        await page.selectOption('select', { index: 1 });
      } else if (await page.locator('button:has-text("😐")').isVisible()) {
        await page.click('button:has-text("🙂")');
      } else {
        await page.fill('textarea', 'Test response');
      }
      if (i < 5) {
        await page.click('button:has-text("Next")');
      } else {
        await page.click('button:has-text("Complete Assessment")');
      }
    }

    await expect(page.locator('text=Assessment completed successfully!')).toBeVisible();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should view reports', async ({ page }) => {
    // Login and complete assessment first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Complete an assessment (5 questions via dashboard)
    await page.click('button:has-text("😐")');
    await page.click('button:has-text("Next")');
    await page.fill('textarea', 'Great day');
    await page.click('button:has-text("Next")');
    for (let i = 3; i <= 4; i++) {
      if (await page.locator('select').isVisible()) {
        await page.selectOption('select', { index: 1 });
      } else if (await page.locator('button:has-text("😐")').isVisible()) {
        await page.click('button:has-text("🙂")');
      } else {
        await page.fill('textarea', 'Test response');
      }
      if (i < 4) {
        await page.click('button:has-text("Next")');
      } else {
        await page.click('button:has-text("Complete Assessment")');
      }
    }

    // Navigate to reports
    await page.click('a:has-text("Reports")');
    await expect(page).toHaveURL(/.*reports/);

    await expect(page.locator('text=Mental Health Reports')).toBeVisible();
    await expect(page.locator('text=Total Assessments')).toBeVisible();
    await expect(page.locator('text=Average Score')).toBeVisible();
  });

  test('should handle voice input', async ({ page }) => {
    await page.route('**/api/transcribe', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'I am feeling good today' }) })
    })
    await page.evaluate(() => {
      (navigator as any).mediaDevices = (navigator as any).mediaDevices || {}
      ;(navigator.mediaDevices as any).getUserMedia = async () => ({ getTracks: () => [{ stop() {} }] })
      class MockMediaRecorder {
        stream: any
        ondataavailable: any = null
        onstart: any = null
        onstop: any = null
        state: string = 'inactive'
        constructor(stream: any) { this.stream = stream }
        start() {
          this.state = 'recording'
          if (this.onstart) this.onstart()
          setTimeout(() => {
            if (this.ondataavailable) this.ondataavailable(new Blob(['foo'], { type: 'audio/webm' }))
            this.state = 'inactive'
            if (this.onstop) this.onstop()
          }, 100)
        }
        stop() {
          this.state = 'inactive'
          if (this.onstop) this.onstop()
        }
      }
      ;(window as any).MediaRecorder = MockMediaRecorder as any
    })
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.click('button[title="Start voice input"]')
    await page.waitForTimeout(300)
    await expect(page.locator('textarea')).toHaveText('I am feeling good today')
  })

  test('should show validation errors', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();

    // Try with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();

    // Try with short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should handle session timeout gracefully', async ({ page, context }) => {
    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Clear cookies to simulate session timeout
    await context.clearCookies();

    // Try to navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});