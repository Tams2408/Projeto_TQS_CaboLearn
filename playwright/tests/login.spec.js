// @ts-check
const { test, expect } = require('@playwright/test');

const ALUNO = { email: 'elves@cabolearn.com', password: 'Admin@2026' };

test.describe('Autenticação', () => {

  test('login com credenciais válidas redireciona para a área do estudante', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', ALUNO.email);
    await page.fill('#password', ALUNO.password);
    await page.click('.login-button');

    await expect(page).toHaveURL(/\/index/);
  });

  test('login com password incorreta mostra mensagem de erro', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', ALUNO.email);
    await page.fill('#password', 'password-errada');
    await page.click('.login-button');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.login-error')).toBeVisible();
    await expect(page.locator('.login-error')).toContainText('incorretos');
  });

  test('login com email inexistente mostra mensagem de erro', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', 'naoexiste@cabolearn.com');
    await page.fill('#password', 'qualquercoisa');
    await page.click('.login-button');

    await expect(page.locator('.login-error')).toBeVisible();
  });

  test('logout termina a sessão e volta ao login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', ALUNO.email);
    await page.fill('#password', ALUNO.password);
    await page.click('.login-button');
    await expect(page).toHaveURL(/\/index/);

    await page.goto('/logout');
    await expect(page).toHaveURL(/\/login/);
  });

});
