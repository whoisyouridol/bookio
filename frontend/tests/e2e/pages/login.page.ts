import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.heading = page.locator('h1');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.heading).toHaveText('Sign in');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Expect a toast error message to appear. */
  async expectError(text: string | RegExp) {
    const toast = this.page.locator('[data-sonner-toast][data-type="error"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(text);
  }

  /** Expect navigation away from login (successful login). */
  async expectLoginSuccess() {
    await expect(this.page).not.toHaveURL(/\/login/, { timeout: 10000 });
  }
}
