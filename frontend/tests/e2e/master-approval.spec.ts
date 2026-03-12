import { test, expect } from './fixtures/auth.fixture';
import { apiRegisterMaster } from './api/auth-api';
import { getAdminUsers, setUserActive, deleteUser, getSalons } from './api/admin-api';
import { LoginPage } from './pages/login.page';
import { uniqueMaster } from './utils/test-data';

test.describe('Master Approval Flow', () => {
  let masterData: ReturnType<typeof uniqueMaster>;
  let salonId: string;
  let createdUserId: string;

  test.beforeAll(async ({ request }) => {
    // Pick the first available salon for master registration
    const salons = await getSalons(request);
    if (salons.length === 0) throw new Error('No salons exist — seed the DB first');
    salonId = salons[0].id;
  });

  test.beforeEach(() => {
    masterData = uniqueMaster();
  });

  test.afterEach(async ({ request, adminToken }) => {
    // Cleanup: delete the test user if it was created
    if (createdUserId) {
      try {
        await deleteUser(request, adminToken, createdUserId);
      } catch {
        // ignore cleanup errors
      }
      createdUserId = '';
    }
  });

  test('newly registered master cannot login, then can after admin approval', async ({
    page,
    request,
    adminToken,
  }) => {
    // ── Step 1: Register a new master via API ───────────────────────────
    await apiRegisterMaster(request, {
      ...masterData,
      salonId,
    });

    // Find the created user to get their ID
    const users = await getAdminUsers(request, adminToken, 'Master');
    const created = users.find(u => u.email === masterData.email);
    expect(created).toBeDefined();
    createdUserId = created!.id;

    // Verify the user is inactive
    expect(created!.isActive).toBe(false);

    // ── Step 2: Attempt login via UI — should fail ──────────────────────
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(masterData.email, masterData.password);
    await loginPage.expectError(/not.*active|not.*approved|pending|inactive|credentials/i);

    // ── Step 3: Admin approves the master ────────────────────────────────
    const activated = await setUserActive(request, adminToken, createdUserId, true);
    expect(activated.isActive).toBe(true);

    // ── Step 4: Login again via UI — should succeed ─────────────────────
    await loginPage.goto();
    await loginPage.login(masterData.email, masterData.password);
    await loginPage.expectLoginSuccess();

    // ── Step 5: Verify we landed on admin area (master role) ────────────
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });
});
