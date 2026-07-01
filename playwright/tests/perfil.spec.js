// @ts-check
const { test, expect } = require('@playwright/test');

const ALUNO = { email: 'elves@cabolearn.com', password: 'Admin@2026' };

test.describe('Perfil do Utilizador', () => {

  test('perfil apresenta o nome do utilizador autenticado', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', ALUNO.email);
    await page.fill('#password', ALUNO.password);
    await page.click('.login-button');
    await expect(page).toHaveURL(/\/index/);

    await page.goto('/perfil');

    await expect(page).toHaveURL(/\/perfil/);
    await expect(page.locator('.user-name')).not.toBeEmpty();
    await expect(page.locator('#avatar-preview')).toBeVisible();
  });

});
