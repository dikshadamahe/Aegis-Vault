import { test, expect, request } from '@playwright/test';

const TEST_USER = {
  email: 'e2e@example.com',
  password: 'Password!123',
  username: 'e2euser'
};

const PASSPHRASE = 'Correct Horse Battery Staple!';

async function registerIfNeeded(baseURL: string) {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post('/api/auth/callback/credentials?json=true', {
    data: { emailOrUsername: TEST_USER.email, password: TEST_USER.password },
  });
  if (res.ok()) {
    await ctx.dispose();
    return; // user exists and login works
  }
  // register via server action endpoint fallback (form route)
  const signup = await ctx.post('/api/auth/register', {
    data: TEST_USER,
  }).catch(() => null);
  await ctx.dispose();
}

test.describe('Vault E2E', () => {
  test('create, edit, delete, search, filter, decrypt, and clipboard', async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('No baseURL');

    // 1) Sign in (or register then sign in). We will attempt UI login.
    await page.goto(baseURL + '/sign-in');
    await page.getByPlaceholder('Enter Email or Username').fill(TEST_USER.email);
    await page.getByPlaceholder('Enter Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /login/i }).click();

    // if login fails, try register then login again
    if (!(await page.waitForURL(/dashboard/, { timeout: 5000 }).then(() => true).catch(() => false))) {
      // try simple register page
      await page.goto(baseURL + '/sign-up');
      await page.getByPlaceholder('Enter your username').fill(TEST_USER.username);
      await page.getByPlaceholder('Enter your email').fill(TEST_USER.email);
      await page.getByPlaceholder('Enter your password').fill(TEST_USER.password);
      await page.getByRole('checkbox', { name: /accept terms/i }).click();
      await page.getByRole('button', { name: /register/i }).click();
      await page.waitForURL(/sign-in/);
      await page.getByPlaceholder('Enter Email or Username').fill(TEST_USER.email);
      await page.getByPlaceholder('Enter Password').fill(TEST_USER.password);
      await page.getByRole('button', { name: /login/i }).click();
    }

    await expect(page).toHaveURL(/dashboard/);

    // Ensure at least one category exists if UI requires it; open Add new password and check category select
    await page.getByRole('button', { name: /add new password/i }).click();
    // If categories list empty, create a category via API
    const hasOptions = await page.getByRole('option').count().then(c => c > 0).catch(() => false);
    if (!hasOptions) {
      const api = await request.newContext({ baseURL });
      await api.post('/api/vault/categories', { data: { name: 'Web Logins', slug: 'web-logins' } });
      await api.dispose();
    }
    // close dialog for now
    await page.keyboard.press('Escape');

    // Intercept vault API responses to ensure no plaintext
    await page.route('**/api/vault/**', async (route) => {
      const res = await route.fetch();
      const cloned = res.clone();
      const contentType = res.headers().get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await cloned.json().catch(() => null);
        if (json) {
          const jsonStr = JSON.stringify(json).toLowerCase();
          expect(jsonStr.includes('"password"')).toBeFalsy(); // no plaintext password key in payloads
        }
      }
      await route.fulfill({ response: res });
    });

    // 2) Create a new password item
    await page.getByRole('button', { name: /add new password/i }).click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /web logins/i }).click();
    await page.getByLabel(/website name/i).fill('Example');
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/^username/i).fill('demo-user');
    await page.getByLabel(/^password$/i).fill('Secret#12345');
    await page.getByLabel(/^url/i).fill('https://example.com');
    await page.getByLabel(/^notes/i).fill('my secure note');
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
