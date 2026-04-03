/**
 * Generates unique test data to avoid collisions between parallel test runs.
 */

const uid = () => Math.random().toString(36).slice(2, 8);

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}+${uid()}@test.bookvisit.com`;
}

export function uniquePhone() {
  return `+1${Date.now().toString().slice(-10)}`;
}

export function uniqueMaster() {
  const id = uid();
  return {
    email: `master+${id}@test.bookvisit.com`,
    password: 'Test1234!',
    firstName: `TestFirst${id}`,
    lastName: `TestLast${id}`,
    phone: `+1${Date.now().toString().slice(-10)}`,
  };
}
