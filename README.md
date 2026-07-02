# CaboLearn — Plataforma de Submissão Académica

[![CI/CD](https://github.com/Tams2408/Projeto_TQS_CaboLearn/actions/workflows/cabolearn.yml/badge.svg)](https://github.com/Tams2408/Projeto_TQS_CaboLearn/actions/workflows/cabolearn.yml)

> Projeto Final de Teste e Qualidade de Software (TQS) - Sprint Mission II - Plataforma Escolar CaboLearn

Os estudantes da plataforma CaboLearn enfrentavam dificuldades ao submeter
trabalhos académicos online: uploads que falhavam, ficheiros rejeitados sem
motivo claro e ausência de confirmação da entrega. Este projeto implementa e
testa uma versão melhorada do sistema de submissão de trabalhos da
plataforma, cobrindo autenticação, submissão, correção pelo professor,
histórico, notificações e gestão de perfil.

---

## Funcionalidades

| Área | Descrição |
|---|---|
| **Autenticação** | Login por sessão com três perfis: `estudante`, `professor` e `admin`. Palavras-passe guardadas com hash (Werkzeug). |
| **Disciplinas e Tarefas** | O professor cria tarefas associadas a uma disciplina, com prazo, tipos de ficheiro aceites e tamanho máximo. |
| **Submissão de Trabalhos** | O estudante submete um ficheiro para uma tarefa; validação de formato, tamanho e prazo (submissões atrasadas ficam marcadas). |
| **Correção** | O professor consulta e corrige as submissões dos estudantes por tarefa. |
| **Histórico** | Registo de todas as submissões e respetivo estado. |
| **Notificações** | Notificações geradas após submissão, correção e outras atividades relevantes. |
| **Perfil** | Atualização de dados pessoais, fotografia de perfil (avatar) e palavra-passe. |
| **Administração** | Criação e gestão de utilizadores (estudantes, professores, admins). |

## Stack Técnico

- **Backend:** Python 3.12 + Flask (persistência em ficheiros JSON, sem base de dados externa)
- **Frontend:** HTML + CSS + JavaScript (Vanilla), templates Jinja2
- **Testes:**
  - PyTest (unitários, API e integração) — `tests/`
  - Playwright (end-to-end, browser real) — `playwright/`
- **Contentorização:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (`.github/workflows/cabolearn.yml`)

---

## Estrutura do Projeto

```
Projeto_TQS_CaboLearn_versao_4/
├── app.py                     # Aplicação Flask principal (rotas, lógica de negócio)
├── criar_utilizador.py        # Script auxiliar para criar o utilizador admin inicial
├── requirements.txt
├── app/
│   ├── html/                  # Templates (Jinja2)
│   ├── css/, js/              # Estáticos
│   └── assets/                # Imagens, ícones, avatares
├── data/                      # Persistência em JSON (users, tarefas, submissões, notificações)
├── uploads/                   # Ficheiros submetidos pelos estudantes (gitignored)
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── playwright/                # Testes end-to-end
│   ├── package.json / package-lock.json
│   ├── playwright.config.js
│   ├── fixtures/
│   └── tests/
├── tests/                     # Testes PyTest
│   ├── api/
│   ├── integration/
│   └── testes_*.py
└── .github/workflows/
    └── cabolearn.yml          # Pipeline de CI/CD
```

---

## Como Executar

### Opção A — Docker (recomendado)

Pré-requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e a correr.

```bash
docker compose -f docker/docker-compose.yml up --build
```

Abre **http://localhost:5000** no browser. Para parar:

```bash
docker compose -f docker/docker-compose.yml down
```

Os dados (`data/`), os ficheiros submetidos (`uploads/`) e os avatares
(`app/assets/uploads/avatars/`) ficam persistidos fora do container através
de volumes — não se perdem ao recriar o container.

### Opção B — Localmente, sem Docker

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Credenciais de Teste

| Perfil | Email | Palavra-passe |
|---|---|---|
| Estudante | `elves@cabolearn.com` | `Admin@2026` |
| Professor | `jferreira@cabolearn.com` | `CaboLearn@2026` |
| Admin | `admin@cabolearn.com` | `Admin@2026` |

---

## Testes

### PyTest (unitários, API, integração)

```bash
pip install -r requirements.txt
pytest tests/ -v
```

Os testes usam `tmp_path`/`monkeypatch` para isolar completamente os dados
de teste dos dados reais em `data/` — podem correr em qualquer ordem, em
paralelo, e não afetam o ambiente de desenvolvimento.

### Playwright (end-to-end)

Requer [Node.js](https://nodejs.org/) instalado.

```bash
cd playwright
npm install
npx playwright install --with-deps
```

Com a aplicação a correr em `http://localhost:5000` (via Docker ou
`python app.py`), num segundo terminal:

```bash
npm test              # corre todos os testes
npm run test:ui       # modo interativo
npm run report        # abre o relatório HTML do último resultado
```

Consulta `playwright/README.md` para mais detalhes sobre a suite de testes.

---

## CI/CD

O workflow `.github/workflows/cabolearn.yml` corre automaticamente a cada
`push`/`pull request` para `main` ou `develop`, em três jobs sequenciais:

1. **Testes Unitários e de API (PyTest)** — instala dependências e corre toda a suite `tests/`.
2. **Testes E2E (Playwright)** — sobe a aplicação real via Docker Compose, aguarda que fique disponível, e corre a suite `playwright/`. O relatório fica disponível como artefacto, mesmo que algum teste falhe.
3. **Build da Imagem Docker** — confirma que a imagem final continua a construir sem erros.

Cada job só avança se o anterior passar. Os resultados dos testes e o
relatório do Playwright ficam disponíveis para download na secção
**Artifacts** de cada execução, em **Actions** no GitHub.

---

## Notas de Implementação

- Palavras-passe armazenadas com hash via Werkzeug Security (nunca em texto simples).
- Autenticação baseada em sessão Flask, com decorators de acesso por perfil (estudante/professor/admin).
- Formatos e tamanho máximo de ficheiro aceites são definidos por tarefa (configurados pelo professor).
- Submissões após o prazo são aceites mas marcadas como atrasadas.
- A pasta `uploads/` está no `.gitignore` de propósito — os ficheiros dos estudantes não vão para o controlo de versões; em produção, deve ser substituída por armazenamento persistente adequado (ex.: volume dedicado, ou serviço de object storage).