const { test, expect } = require('@playwright/test');

async function openVehicleInventory(page) {
  const email = process.env.PLAYWRIGHT_LOGIN_EMAIL;
  const password = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

  test.skip(
    !email || !password,
    'Set PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD in .env to run authenticated tests.'
  );

  await page.goto('/login');
  await page.getByPlaceholder('Enter your email address').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/dashboard\/?$/, { timeout: 20000 });

  await page.goto('/assets');
  await expect(
    page.getByRole('heading', { name: 'Vehicle Inventory' })
  ).toBeVisible();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ results/)).toBeVisible();

  const allowLocation = page.getByRole('button', { name: 'Allow location' });
  if (await allowLocation.isVisible()) {
    await allowLocation.click();
    await expect(allowLocation).toBeHidden();
  }
}

test.describe('Asset Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await openVehicleInventory(page);
  });

  test('[TC_LST_01 smoke] shows the overview and currently available list controls', async ({ page }) => {
    await expect(page.getByText('Manage and track your vehicles')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import Vehicles' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Vehicle' })).toBeVisible();
    await expect(page.getByText('Total Vehicles', { exact: true })).toBeVisible();
    await expect(page.getByText('Utilisation Rate', { exact: true })).toBeVisible();
    await expect(page.getByText('Compliance Alerts', { exact: true })).toBeVisible();
    await expect(page.getByText('No Telematics', { exact: true })).toBeVisible();

    for (const column of [
      'Registration No.',
      'Model',
      'OEM',
      'Rider Name',
      'Hub',
      'Type of Deployment',
      'Mobilised Since',
      'Odometer',
      'Last Synced',
    ]) {
      await expect(page.getByText(column, { exact: true })).toBeVisible();
    }
  });

  test('[TC_LST_16 registration] searches a visible registration and shows no-match state', async ({ page }) => {
    const pageText = await page.locator('body').innerText();
    const registration = pageText.match(/\b[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}\b/)?.[0];

    if (!registration) {
      throw new Error('No vehicle registration was visible to use as a search value.');
    }

    const search = page.getByPlaceholder('Search registration, chassis or model...');
    await search.fill(registration);
    await expect(page.getByText(registration, { exact: true })).toBeVisible();

    await search.fill('AUTOMATION-NO-MATCH-987654');
    await expect(page.getByText('No vehicles match the applied filters', { exact: false }))
      .toBeVisible();
  });

  test('[TC_ONB required-fields] blocks onboarding until required vehicle details are entered', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Vehicle' }).click();
    await expect(page).toHaveURL(/\/assets\/add\/?$/);
    await expect(page.getByPlaceholder('Enter Registration Number')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Chassis Number')).toBeVisible();

    await page.getByRole('button', { name: 'Enter manually' }).click();
    await expect(page.getByPlaceholder('Enter Engine Number')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});
