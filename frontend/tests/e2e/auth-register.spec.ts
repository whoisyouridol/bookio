import { test, expect } from '@playwright/test';
import { RegisterPage } from './pages/register.page';
import { uniqueEmail, uniquePhone } from './utils/test-data';

test.describe('Registration Page', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('register with email only — succeeds and navigates away', async () => {
    const email = uniqueEmail('reg');
    await registerPage.registerWithEmail(email, 'Test1234!');
    await registerPage.expectSuccess();
  });

  test('register with phone only — succeeds and navigates away', async () => {
    const phone = uniquePhone();
    await registerPage.registerWithPhone(phone, 'Test1234!');
    await registerPage.expectSuccess();
  });

  test('register with both email and phone — succeeds', async () => {
    const email = uniqueEmail('reg');
    const phone = uniquePhone();
    await registerPage.registerWithBoth(email, phone, 'Test1234!');
    await registerPage.expectSuccess();
  });

  test('register without email or phone — shows error toast', async () => {
    await registerPage.fillPassword('Test1234!');
    await registerPage.submit();
    await registerPage.expectError(/email|phone/i);
  });

  test('register with duplicate email — shows error toast', async ({ request }) => {
    const email = uniqueEmail('dup');
    // Register via API first
    const res = await request.post('/api/auth/register', {
      data: { email, password: 'Test1234!', firstName: 'Dup', lastName: 'Test' },
    });
    expect(res.ok()).toBeTruthy();

    // Try registering via UI with the same email
    await registerPage.fillEmail(email);
    await registerPage.fillPassword('Test1234!');
    await registerPage.submit();
    await registerPage.expectError(/already|exists|taken|duplicate/i);
  });
});
