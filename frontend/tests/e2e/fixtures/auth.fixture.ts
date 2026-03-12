import { test as base } from '@playwright/test';
import { getSuperAdminToken } from '../api/auth-api';

/**
 * Extended test fixture that provides a pre-authenticated SuperAdmin API token.
 */
type AuthFixtures = {
  adminToken: string;
};

export const test = base.extend<AuthFixtures>({
  adminToken: async ({ request }, use) => {
    const token = await getSuperAdminToken(request);
    await use(token);
  },
});

export { expect } from '@playwright/test';
