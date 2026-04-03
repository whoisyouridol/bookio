import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { uniqueEmail, uniquePhone } from './utils/test-data';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('login with email — succeeds and navigates away', async ({ request }) => {
    const email = uniqueEmail('login');
    // Pre-register via API
    await request.post('/api/auth/register', {
      data: { email, password: 'Test1234!', firstName: 'Login', lastName: 'Email' },
    });

    await loginPage.goto();
    await loginPage.login(email, 'Test1234!');
    await loginPage.expectLoginSuccess();
  });

  test('login with phone — succeeds and navigates away', async ({ request }) => {
    const phone = uniquePhone();
    // Pre-register via API
    await request.post('/api/auth/register', {
      data: { password: 'Test1234!', firstName: 'Login', lastName: 'Phone', phone },
    });

    await loginPage.goto();
    await loginPage.login(phone, 'Test1234!');
    await loginPage.expectLoginSuccess();
  });

  test('login with wrong password — shows error toast', async ({ request }) => {
    const email = uniqueEmail('wrongpw');
    await request.post('/api/auth/register', {
      data: { email, password: 'Test1234!', firstName: 'Wrong', lastName: 'Pass' },
    });

    await loginPage.goto();
    await loginPage.login(email, 'WrongPassword1!');
    await loginPage.expectError(/invalid|credentials|incorrect/i);
  });

  test('login with nonexistent user — shows error toast', async () => {
    await loginPage.goto();
    await loginPage.login('nobody@nowhere.com', 'Test1234!');
    await loginPage.expectError(/invalid|credentials|incorrect/i);
  });

  test('empty identifier field — form validation prevents submit', async ({ page }) => {
    await loginPage.goto();
    // Only fill password, leave identifier empty — browser required validation should block
    await loginPage.passwordInput.fill('Test1234!');
    await loginPage.submitButton.click();

    // Should still be on login page (form didn't submit)
    await expect(page).toHaveURL(/\/login/);
  });
});
