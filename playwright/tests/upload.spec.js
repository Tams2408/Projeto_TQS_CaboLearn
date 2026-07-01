// @ts-check
const path = require('path');
const { test, expect } = require('@playwright/test');

const ALUNO = { email: 'elves@cabolearn.com', password: 'Admin@2026' };

async function login(page) {
  await page.goto('/login');
  await page.fill('#email', ALUNO.email);
  await page.fill('#password', ALUNO.password);
  await page.click('.login-button');
  await expect(page).toHaveURL(/\/index/);
}

/**
 * Seleciona a disciplina e aguarda que a lista de tarefas seja carregada via AJAX.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} disciplina
 * @param {number} indiceTarefa - Índice da tarefa a selecionar (0 = primeira).
 *   Cada teste usa um índice diferente de propósito: assim que um teste
 *   submete um trabalho para uma tarefa, essa tarefa passa a ter uma
 *   submissão existente para o aluno de teste, o que muda o comportamento
 *   do formulário (passa a permitir "atualizar" sem novo ficheiro). Usar
 *   tarefas diferentes por teste evita que um teste influencie o outro.
 */
async function selecionarDisciplinaETarefa(page, disciplina = 'Matemática', indiceTarefa = 0) {
  await page.selectOption('#disciplina', disciplina);

  // O upload.js faz fetch('/api/tarefas?disciplina=...') ao mudar a disciplina.
  // Aguarda até existir pelo menos uma opção de tarefa além do placeholder.
  await page.waitForFunction(() => {
    const select = document.getElementById('tarefa');
    return select && select.options.length > 1;
  });

  const valores = await page.locator('#tarefa option').evaluateAll(
    (opcoes) => opcoes.map((o) => o.value).filter((v) => v !== '')
  );

  test.skip(
    valores.length <= indiceTarefa,
    `Sem tarefas suficientes para a disciplina "${disciplina}" nos dados de teste ` +
    `(precisava de pelo menos ${indiceTarefa + 1}, existem ${valores.length}).`
  );

  await page.selectOption('#tarefa', valores[indiceTarefa]);

  // Aguarda que o fetch('/api/minha-submissao/...') despoletado pela troca de
  // tarefa termine, para garantir que o formulário já reflete corretamente
  // se já existe ou não uma submissão prévia para esta tarefa.
  await page.waitForLoadState('networkidle');
}

test.describe('Submissão de Trabalhos (Upload)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/upload');
  });

  test('submissão de ficheiro válido é aceite e redireciona para Submissões', async ({ page }) => {
    await selecionarDisciplinaETarefa(page, 'Matemática', 0);

    await page.setInputFiles('#file-upload', path.join(__dirname, '..', 'fixtures', 'trabalho-teste.pdf'));
    await page.check('input[name="autoria"]');

    await page.click('.btn-submit');

    await expect(page.locator('#upload-alert')).toBeVisible();
    await expect(page.locator('#upload-alert')).toHaveClass(/success/);

    // O upload_submit.js redireciona para /submissoes ~1.4s depois do sucesso
    await expect(page).toHaveURL(/\/submissoes/, { timeout: 5000 });
  });

  test('submissão de ficheiro com formato não aceite mostra erro', async ({ page }) => {
    await selecionarDisciplinaETarefa(page, 'Matemática', 1);

    await page.setInputFiles('#file-upload', path.join(__dirname, '..', 'fixtures', 'ficheiro-invalido.exe'));
    await page.check('input[name="autoria"]');

    await page.click('.btn-submit');

    await expect(page.locator('#upload-alert')).toBeVisible();
    await expect(page.locator('#upload-alert')).toHaveClass(/error/);
    await expect(page.locator('#upload-alert')).toContainText('Tipo de ficheiro inválido');
  });

  test('submeter sem disciplina/tarefa é bloqueado pela validação nativa do formulário', async ({ page }) => {
    // #disciplina e #tarefa têm o atributo "required" no HTML, por isso o
    // browser bloqueia o envio antes de o JavaScript da app ser executado.
    await page.click('.btn-submit');

    // Continuamos na mesma página (o formulário não chegou a ser submetido)
    await expect(page).toHaveURL(/\/upload/);
    await expect(page.locator('#upload-alert')).toBeHidden();

    const disciplinaValida = await page.locator('#disciplina').evaluate(
      (el) => el.checkValidity()
    );
    expect(disciplinaValida).toBe(false);
  });

  test('submissão sem selecionar ficheiro mostra erro de validação da app', async ({ page }) => {
    // Usa uma tarefa dedicada (índice 2) para garantir que nunca existe
    // uma submissão prévia aqui que mudaria a validação de "obrigatório
    // selecionar ficheiro" para um fluxo de "atualizar submissão".
    await selecionarDisciplinaETarefa(page, 'Matemática', 2);

    // Disciplina e tarefa preenchidas, mas nenhum ficheiro selecionado.
    // O input de ficheiro não é "required" no HTML, por isso o formulário
    // é submetido e é o JavaScript da app que valida e mostra o erro.
    await page.click('.btn-submit');

    await expect(page.locator('#upload-alert')).toBeVisible();
    await expect(page.locator('#upload-alert')).toContainText('Selecione um ficheiro antes de submeter');
  });

});