// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Segurança - Rotas Protegidas', () => {

  const rotasProtegidas = ['/index', '/upload', '/historico', '/perfil', '/notificacoes', '/submissoes'];

  for (const rota of rotasProtegidas) {
    test(`aceder a ${rota} sem sessão redireciona para o login`, async ({ page }) => {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login/);
    });
  }

});
