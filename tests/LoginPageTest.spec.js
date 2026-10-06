const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test('shows the login screen', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Login to your account' })
  ).toBeVisible();
  await expect(page.getByPlaceholder('Enter your email address')).toBeVisible();
  await expect(page.getByPlaceholder('Enter Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Create New Account' })
  ).toBeVisible();

  await page.waitForTimeout(5000);
});

test('logs in with valid credentials', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_LOGIN_EMAIL;
  const password = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

  test.skip(
    !email || !password,
    'Set PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD to run the login flow.'
  );

  await page.getByPlaceholder('Enter your email address').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect
    .poll(
      () => new URL(page.url()).pathname.replace(/\/+$/, ''),
      { message: 'Login should navigate away from the login page.' }
    )
    .not.toBe('/login');

  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Allow location access?')).toBeVisible();
  await page.getByRole('button', { name: 'Allow location' }).click();
  await expect(page.getByText('Allow location access?')).toBeHidden();
});