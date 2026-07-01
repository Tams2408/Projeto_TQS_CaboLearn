// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuração do Playwright para a plataforma CaboLearn.
 * A app deve estar a correr em http://localhost:5000 antes dos testes
 * (via `python app.py`, `docker compose up`, ou automaticamente através
 * da opção "webServer" abaixo).
 */
module.exports = defineConfig({
  testDir: './tests',

  fullyParallel: false, // os testes partilham ficheiros JSON em disco (data/), evitar corridas em paralelo
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Descomentar para o Playwright arrancar a app Flask automaticamente
  // antes dos testes e desligá-la no fim:
  //
  // webServer: {
  //   command: 'python ../app.py',
  //   url: 'http://localhost:5000/login',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30 * 1000,
  // },
});
