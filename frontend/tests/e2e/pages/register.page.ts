import { type Page, type Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly submitButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('register-email');
    this.phoneInput = page.getByTestId('register-phone');
    this.passwordInput = page.getByTestId('register-password');
    this.confirmPasswordInput = page.getByTestId('register-confirm-password');
    this.firstNameInput = page.getByTestId('register-first-name');
    this.lastNameInput = page.getByTestId('register-last-name');
    this.submitButton = page.getByTestId('register-submit');
    this.heading = page.locator('h1');
  }

  async goto() {
    await this.page.goto('/register');
    await expect(this.heading).toBeVisible();
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  async fillName(first: string, last: string) {
    await this.firstNameInput.fill(first);
    await this.lastNameInput.fill(last);
  }

  async submit() {
    await this.submitButton.click();
  }

  async registerWithEmail(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async registerWithPhone(phone: string, password: string) {
    await this.fillPhone(phone);
    await this.fillPassword(password);
    await this.submit();
  }

  async registerWithBoth(email: string, phone: string, password: string) {
    await this.fillEmail(email);
    await this.fillPhone(phone);
    await this.fillPassword(password);
    await this.submit();
  }

  async expectError(text: string | RegExp) {
    const toast = this.page.locator('[data-sonner-toast][data-type="error"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(text);
  }

  async expectSuccess() {
    // After successful client registration, should navigate away from /register
    await expect(this.page).not.toHaveURL(/\/register/, { timeout: 10000 });
  }
}
