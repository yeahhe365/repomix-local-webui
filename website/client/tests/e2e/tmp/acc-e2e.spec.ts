import { expect, test } from '@playwright/test';

test('collapsed accordion body is inert and not keyboard reachable; expands correctly', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('.options-accordion__body');
  const header = page.locator('.options-accordion__header');

  // Collapsed state
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await expect(body).toHaveAttribute('inert', '');
  await expect(body).toHaveAttribute('aria-hidden', 'true');

  // The first format button (inside the collapsed body) is not reachable by keyboard.
  const formatXml = page.getByRole('button', { name: 'XML', exact: true });
  await expect(formatXml).toBeHidden();

  // Header is focusable and activatable.
  await header.focus();
  await expect(header).toBeFocused();
  await page.keyboard.press('Enter');

  // Expanded state
  await expect(header).toHaveAttribute('aria-expanded', 'true');
  await expect(body).not.toHaveAttribute('inert');
  await expect(body).not.toHaveAttribute('aria-hidden');
  await expect(formatXml).toBeVisible();
});

test('advanced options have no duplicate output-format label', async ({ page }) => {
  await page.goto('/');
  await page.locator('.options-accordion__header').click();
  // Only the section title should say 输出格式; no nested .option-label duplicates.
  await expect(page.locator('.option-section .option-label', { hasText: '输出格式' })).toHaveCount(0);
  await expect(page.locator('.options-section__title', { hasText: '输出格式' })).toHaveCount(1);
});

test('custom checkboxes render and toggle', async ({ page }) => {
  await page.goto('/');
  await page.locator('.options-accordion__header').click();
  const first = page.locator('.checkbox-input').first();
  const box = page.locator('.checkbox-box').first();
  await expect(box).toBeVisible();
  await first.check();
  await expect(first).toBeChecked();
});
