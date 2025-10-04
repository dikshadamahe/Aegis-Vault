import { request, APIRequestContext, Page, expect } from '@playwright/test';

export async function createApiContext(baseURL: string): Promise<APIRequestContext> {
  return await request.newContext({ baseURL });
}

export async function loginUI(page: Page, baseURL: string, email: string, password: string) {
  await page.goto(baseURL + '/sign-in');
  await page.getByPlaceholder('Enter Email or Username').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

export async function setPassphrase(page: Page, passphrase: string) {
  // This opens on first encrypt/decrypt. We ensure we fill when visible.
  const dialog = page.getByRole('dialog').filter({ hasText: /unlock vault/i });
  if (await dialog.isVisible()) {
    const input = page.getByLabel(/passphrase/i);
    await input.fill(passphrase);
    await page.getByRole('button', { name: /confirm/i }).click();
  }
}
