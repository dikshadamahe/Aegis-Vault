import { test, expect, request, Page, APIRequestContext, Route } from '@playwright/test';

const TEST_USER = {
  email: 'e2e@example.com',
  password: 'Password!123',
  username: 'e2euser'
};

const PASSPHRASE = 'Correct Horse Battery Staple!';

test.describe('Vault E2E', () => {
  test.beforeEach(async ({ baseURL, request }: { baseURL: string | undefined; request: APIRequestContext }) => {
    if (!baseURL) throw new Error('No baseURL');
    // Seed all: user + categories + clear items for isolation
    await request.post('/api/test/seed-all', { data: { email: TEST_USER.email, username: TEST_USER.username, password: TEST_USER.password, categories: [{ name: 'Web Logins', slug: 'web-logins' }] } });
  });

  test.afterAll(async ({ request }: { request: APIRequestContext }) => {
    await request.post('/api/test/teardown', { data: { email: TEST_USER.email } });
  });

  test('create, edit, delete, search, filter, decrypt, and clipboard', async ({ page, baseURL }: { page: Page; baseURL: string | undefined }) => {
    if (!baseURL) throw new Error('No baseURL');

    // 1) Sign in via UI
  await page.goto(baseURL + '/sign-in');
  await page.getByTestId('signin-email-or-username').fill(TEST_USER.email);
  await page.getByTestId('signin-password').fill(TEST_USER.password);
  await page.getByTestId('signin-submit').click();

    await expect(page).toHaveURL(/dashboard/);

    // category already seeded via seed-all in beforeEach

    // Intercept vault API requests/responses to ensure no plaintext and ciphertext-only on writes
  await page.route('**/api/vault/**', async (route: Route) => {
      const req = route.request();
      const method = req.method();
      if (method === 'POST' || method === 'PATCH') {
        const body = req.postDataJSON?.() as any;
        if (body) {
          // ensure we do not send plaintext password or notes
          expect(body.password).toBeFalsy();
          expect(body.notes).toBeFalsy();
          // ensure ciphertext fields exist on write
          expect(typeof body.passwordCiphertext).toBe('string');
          expect(typeof body.passwordNonce).toBe('string');
          expect(typeof body.passwordSalt).toBe('string');
        }
      }
      const res = await route.fetch();
      const cloned = res.clone();
      const contentType = res.headers().get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await cloned.json().catch(() => null);
        if (json) {
          const hasPlainKeys = (obj: any): boolean => {
            if (obj && typeof obj === 'object') {
              for (const key of Object.keys(obj)) {
                const lower = key.toLowerCase();
                if (lower === 'password' || lower === 'notes') return true;
                const val = (obj as any)[key];
                if (val && typeof val === 'object' && hasPlainKeys(val)) return true;
              }
            }
            return false;
          };
          expect(hasPlainKeys(json)).toBeFalsy();
        }
      }
      await route.fulfill({ response: res });
    });

    // 2) Create a new password item
  await page.getByRole('button', { name: /add new password/i }).click();
  await page.getByTestId('category-select').click();
    await page.getByRole('option', { name: /web logins/i }).click();
  await page.getByTestId('website-input').fill('Example');
  await page.getByTestId('email-input').fill('user@example.com');
  await page.getByLabel(/^username/i).fill('demo-user');
  await page.getByTestId('password-input').fill('Secret#12345');
  await page.getByTestId('url-input').fill('https://example.com');
  await page.getByTestId('notes-input').fill('my secure note');
    await page.getByRole('button', { name: /^create$/i }).click();

    // passphrase modal appears; enter passphrase
    const modal = page.getByRole('dialog').filter({ hasText: /unlock vault/i });
    await modal.waitFor({ state: 'visible' });
    await page.getByLabel(/passphrase/i).fill(PASSPHRASE);
    await page.getByRole('button', { name: /confirm/i }).click();

    // item should be created and appear in list
    await expect(page.getByText(/example/i)).toBeVisible();

    // 3) Search should filter results
    const search = page.getByRole('searchbox', { name: /search/i });
    await search.fill('exam');
    await expect(page.getByText(/example/i)).toBeVisible();
    await search.fill('no-results-term');
    await expect(page.getByText(/no password found/i)).toBeVisible();
    await search.fill('example');

    // 4) Category filter via sidebar
    const webLoginsBtn = page.getByRole('button', { name: /web logins/i });
    await webLoginsBtn.click();
    await expect(page.getByText(/example/i)).toBeVisible();

    // 5) Reveal password (decrypt client-side)
  const revealBtn = page.getByTestId('reveal-password').first();
    await revealBtn.click();
    // If passphrase expired, modal appears again
    const maybeModal = page.getByRole('dialog').filter({ hasText: /unlock vault/i });
    if (await maybeModal.isVisible().catch(() => false)) {
      await page.getByLabel(/passphrase/i).fill(PASSPHRASE);
      await page.getByRole('button', { name: /confirm/i }).click();
    }
    // After reveal, we expect the plaintext to appear somewhere in the row
    await expect(page.getByText('Secret#12345')).toBeVisible();

    // 6) Copy to clipboard and auto-clear
  const copyBtn = page.getByTestId('copy-button').first();
    await copyBtn.click();
    // Verify clipboard contains value
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.length).toBeGreaterThan(0);
    // Wait ~16s then expect cleared
    await page.waitForTimeout(16000);
    const cleared = await page.evaluate(() => navigator.clipboard.readText());
    expect(cleared).toBe('');

    // 7) Edit the item
    await page.getByRole('button', { name: /edit/i }).click();
    await page.getByLabel(/^password$/i).fill('Secret#54321');
    await page.getByRole('button', { name: /^save$/i }).click();
    // passphrase may be requested again
    if (await maybeModal.isVisible().catch(() => false)) {
      await page.getByLabel(/passphrase/i).fill(PASSPHRASE);
      await page.getByRole('button', { name: /confirm/i }).click();
    }

    // 8) Delete the item
    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /^delete$/i }).last().click();

    // Verify item removed (search "example" now shows empty state)
    await search.fill('example');
    await expect(page.getByText(/no password found/i)).toBeVisible();
  });
});
