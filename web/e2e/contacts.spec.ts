import { test, expect, Page } from '@playwright/test';
const initial = [
  { id: '00000000-0000-0000-0000-000000000001', firstName: 'Ananya', lastName: 'Raman', email: 'ananya@example.com', phoneNumber: '+91 90000 00001', address: '12 Demo Street', city: 'Chennai', state: 'Tamil Nadu', country: 'India', postalCode: '600001', createdAtUtc: '2026-01-01T12:00:00Z', version: '11111111-1111-1111-1111-111111111111' },
  { id: '00000000-0000-0000-0000-000000000002', firstName: 'Daniel', lastName: 'Lee', email: 'daniel@example.com', phoneNumber: '+1 202 555 0104', address: '45 Demo Lane', city: 'Seattle', state: 'Washington', country: 'United States', postalCode: '98101', createdAtUtc: '2026-01-01T11:00:00Z', version: '22222222-2222-2222-2222-222222222222' }
];
// HTTP fixtures isolate browser behavior. API integration tests exercise the real server separately.
async function mockApi(page: Page) {
  let contacts = structuredClone(initial);
  await page.route('**/api/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname;
    if (path === '/api/auth/login') {
      const body = request.postDataJSON();
      return route.fulfill(body.password === 'wrong' ? { status: 401, json: { title: 'Invalid username or password.' } } :
        { json: { accessToken: 'browser-test-token', username: body.username, expiresAtUtc: new Date(Date.now() + 1800000).toISOString() } });
    }
    if (request.headers()['authorization'] !== 'Bearer browser-test-token') return route.fulfill({ status: 401 });
    if (path === '/api/client-logs') return route.fulfill({ status: 204 });
    if (path === '/api/contacts' && request.method() === 'GET') return route.fulfill({ json: contacts });
    if (path === '/api/contacts' && request.method() === 'POST') {
      const contact = { ...request.postDataJSON(), id: '00000000-0000-0000-0000-000000000099', version: '33333333-3333-3333-3333-333333333333', createdAtUtc: new Date().toISOString() };
      contacts.unshift(contact); return route.fulfill({ status: 201, json: contact });
    }
    const id = path.split('/').pop(); const contact = contacts.find(c => c.id === id);
    if (!contact) return route.fulfill({ status: 404, json: { title: 'Contact not found.' } });
    if (request.method() === 'GET') return route.fulfill({ json: contact });
    if (request.method() === 'PUT') { Object.assign(contact, request.postDataJSON(), { version: '44444444-4444-4444-4444-444444444444' }); return route.fulfill({ json: contact }); }
    if (request.method() === 'DELETE') { contacts = contacts.filter(c => c.id !== id); return route.fulfill({ status: 204 }); }
    return route.fulfill({ status: 405 });
  });
}
async function login(page: Page) {
  await page.goto('/'); await page.getByLabel('Username').fill('reviewer');
  await page.getByLabel('Password', { exact: true }).fill('demo-password'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Contacts/ })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(2);
}
test.beforeEach(async ({ page }) => { await mockApi(page); });
test('login validation, protected route and sign out', async ({ page }) => {
  await page.goto('/contacts'); await expect(page).toHaveURL(/login/);
  await page.getByLabel('Username').fill('reviewer'); await page.getByLabel('Password', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('credentials');
  await login(page); await page.getByRole('button', { name: 'Sign out' }).click(); await expect(page).toHaveURL(/login/);
});
test('create validates inputs and returns highlighted contact at top', async ({ page }) => {
  await login(page); await page.getByLabel('Search contacts').fill('Daniel');
  await page.getByRole('link', { name: '+ Add contact' }).click();
  await page.getByRole('button', { name: 'Create contact' }).click();
  await expect(page.locator('#firstName')).toHaveAttribute('aria-invalid', 'true');
  const values = { firstName: 'Zoe', lastName: 'Patel', email: 'zoe@example.com', phoneNumber: '+91 90000 00009', address: '9 Example Road', city: 'Pune', state: 'Maharashtra', country: 'India', postalCode: '411001' };
  for (const [key, value] of Object.entries(values)) await page.locator(`#${key}`).fill(value);
  await page.getByRole('button', { name: 'Create contact' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr').first()).toContainText('Zoe');
  await expect(page.locator('tbody tr').first()).toHaveClass(/new-contact/);
  await expect(page.getByLabel('Search contacts')).toHaveValue('');
});
test('edit and delete flow with cancellation', async ({ page }) => {
  await login(page); await page.getByRole('link', { name: 'Edit Ananya Raman', exact: true }).click();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ananya');
  await page.getByLabel('City', { exact: true }).fill('Coimbatore'); await page.getByRole('button', { name: 'Save contact', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('Coimbatore');
  await page.getByRole('link', { name: 'Delete Ananya Raman', exact: true }).click(); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('link', { name: 'Delete Ananya Raman', exact: true }).click(); await page.getByRole('button', { name: 'Delete contact', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1); await expect(page.locator('tbody')).not.toContainText('Ananya');
});
test('all nine fields sort, search empty state, mobile width', async ({ page }) => {
  await login(page);
  for (const label of ['First name','Last name','Email','Phone number','Address','City','State','Country','Postal code']) {
    const heading = page.getByRole('columnheader').filter({ hasText: label });
    await heading.getByRole('button').click(); await expect(heading).toHaveAttribute('aria-sort', 'ascending');
    await heading.getByRole('button').click(); await expect(heading).toHaveAttribute('aria-sort', 'descending');
  }
  await page.getByRole('button', { name: /^First name/ }).click(); await expect(page.locator('tbody tr').first()).toContainText('Ananya');
  await page.getByRole('button', { name: /^First name/ }).click(); await expect(page.locator('tbody tr').first()).toContainText('Daniel');
  await page.getByLabel('Search contacts').fill('no-such-person'); await expect(page.locator('tbody')).toContainText('No contacts match');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('dialog supports Escape and keeps focus inside', async ({ page }) => {
  await login(page); await page.getByRole('link', { name: '+ Add contact' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let n = 0; n < 15; n++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('API errors preserve form and are visible', async ({ page }) => {
  await login(page);
  await page.route('**/api/contacts/*', route => route.request().method() === 'PUT' ? route.fulfill({ status: 409, json: { title: 'This contact changed. Refresh and try again.' } }) : route.fallback());
  await page.getByRole('link', { name: 'Edit Ananya Raman', exact: true }).click();
  await page.getByLabel('City', { exact: true }).fill('Madurai'); await page.getByRole('button', { name: 'Save contact', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('This contact changed'); await expect(page.getByLabel('City', { exact: true })).toHaveValue('Madurai');
});
