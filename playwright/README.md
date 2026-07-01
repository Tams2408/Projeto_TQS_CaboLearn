# Testes Playwright — CaboLearn

Testes end-to-end (E2E) que correm num browser real e validam o
comportamento da plataforma CaboLearn tal como um utilizador o veria.

## 1. Instalação (só precisas de fazer isto uma vez)

Precisas do **Node.js** instalado (v18 ou superior). Depois, a partir desta
pasta (`playwright/`):

```bash
cd playwright
npm install
npx playwright install --with-deps
```

O segundo comando descarrega os browsers (Chromium, Firefox, WebKit) que o
Playwright controla.

## 2. Arrancar a aplicação CaboLearn

Os testes precisam da app a correr em `http://localhost:5000`. Escolhe uma
das opções, num terminal à parte:

**Opção A — Docker (recomendado):**
```bash
docker compose -f docker/docker-compose.yml up --build
```

**Opção B — Python diretamente:**
```bash
python app.py
```

Confirma que consegues abrir `http://localhost:5000/login` no browser antes
de avançar.

## 3. Correr os testes

Num segundo terminal, dentro da pasta `playwright/`:

```bash
npm test
```

Outras formas úteis de correr:

```bash
npm run test:headed   # abre o browser e mostra os testes a correr
npm run test:ui       # modo interativo do Playwright (recomendado para explorar)
npm run test:debug    # modo debug passo a passo
npx playwright test tests/login.spec.js   # correr apenas um ficheiro
```

## 4. Ver o relatório

Depois de correr os testes:

```bash
npm run report
```

Abre um relatório HTML no browser com o detalhe de cada teste, capturas de
ecrã e vídeo dos testes que falharam.

## Estrutura

```
playwright/
├── package.json
├── playwright.config.js     # baseURL http://localhost:5000
├── fixtures/                 # ficheiros usados nos testes de upload
│   ├── trabalho-teste.pdf
│   └── ficheiro-invalido.exe
└── tests/
    ├── login.spec.js              # autenticação (válida, inválida, logout)
    ├── rotas-protegidas.spec.js   # acesso sem sessão é bloqueado
    ├── upload.spec.js             # submissão de trabalhos (válida/inválida)
    └── perfil.spec.js             # página de perfil
```

## Notas

- Os testes de `upload.spec.js` usam a disciplina **"Matemática"**, que já
  tem tarefas ativas nos dados de exemplo (`data/tarefas.json`). Se limpares
  ou alterares esses dados, os testes podem ficar sem tarefas disponíveis
  (nesse caso, o teste é saltado automaticamente com um aviso, em vez de
  falhar).
- `workers: 1` está definido no `playwright.config.js` porque os testes
  escrevem no mesmo `data/submissoes.json` — corrê-los em paralelo pode
  causar condições de corrida nos ficheiros JSON.
- Para integração contínua (CI/CD), basta adicionar estes comandos a um
  workflow do GitHub Actions, correndo `npm ci`, `npx playwright install
  --with-deps` e `npm test` depois de arrancar a app (por exemplo, via
  Docker Compose em background).
