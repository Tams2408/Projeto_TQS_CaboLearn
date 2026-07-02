import io
import json
from datetime import datetime, timedelta

import pytest
from werkzeug.security import generate_password_hash


@pytest.fixture()
def app_module(monkeypatch, tmp_path):
    import app as app_module

    data_dir = tmp_path / "data"
    uploads_dir = tmp_path / "uploads"

    data_dir.mkdir()
    uploads_dir.mkdir()

    users_file = data_dir / "users.json"
    tarefas_file = data_dir / "tarefas.json"
    submissoes_file = data_dir / "submissoes.json"
    notificacoes_file = data_dir / "notificacoes.json"
    emails_file = data_dir / "emails.json"

    users = [
        {
            "id": 1,
            "nome_completo": "Aluno Teste",
            "email": "aluno@cabolearn.com",
            "password_hash": generate_password_hash("Aluno@2026"),
            "tipo": "estudante",
            "disciplinas": ["TIC", "Matemática"]
        },
        {
            "id": 2,
            "nome_completo": "Professor Teste",
            "email": "professor@cabolearn.com",
            "password_hash": generate_password_hash("Professor@2026"),
            "tipo": "professor",
            "disciplina": "TIC"
        }
    ]

    prazo_futuro = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%dT%H:%M")
    prazo_passado = (datetime.now() - timedelta(days=1, hours=2)).strftime("%Y-%m-%dT%H:%M")

    tarefas = [
        {
            "id": 1,
            "professor_id": 2,
            "professor_nome": "Professor Teste",
            "disciplina": "TIC",
            "titulo": "Trabalho de Integração",
            "descricao": "Submeter relatório",
            "prazo": prazo_futuro,
            "tipos_aceitos": [".pdf", ".docx"],
            "tamanho_maximo_mb": 20,
            "ativa": True,
            "criada_em": datetime.now().strftime("%d/%m/%Y %H:%M")
        },
        {
            "id": 2,
            "professor_id": 2,
            "professor_nome": "Professor Teste",
            "disciplina": "TIC",
            "titulo": "Trabalho Fora do Prazo",
            "descricao": "Submeter mesmo atrasado",
            "prazo": prazo_passado,
            "tipos_aceitos": [".pdf"],
            "tamanho_maximo_mb": 20,
            "ativa": True,
            "criada_em": datetime.now().strftime("%d/%m/%Y %H:%M")
        },
        {
            "id": 3,
            "professor_id": 2,
            "professor_nome": "Professor Teste",
            "disciplina": "TIC",
            "titulo": "Tarefa Inativa",
            "descricao": "Não deve aceitar submissão",
            "prazo": prazo_futuro,
            "tipos_aceitos": [".pdf"],
            "tamanho_maximo_mb": 20,
            "ativa": False,
            "criada_em": datetime.now().strftime("%d/%m/%Y %H:%M")
        }
    ]

    write_json(users_file, users)
    write_json(tarefas_file, tarefas)
    write_json(submissoes_file, [])
    write_json(notificacoes_file, [])
    write_json(emails_file, [])

    monkeypatch.setattr(app_module, "USERS_FILE", str(users_file), raising=False)
    monkeypatch.setattr(app_module, "TAREFAS_FILE", str(tarefas_file), raising=False)
    monkeypatch.setattr(app_module, "SUBMISSOES_FILE", str(submissoes_file), raising=False)
    monkeypatch.setattr(app_module, "NOTIFICACOES_FILE", str(notificacoes_file), raising=False)
    monkeypatch.setattr(app_module, "EMAILS_FILE", str(emails_file), raising=False)
    monkeypatch.setattr(app_module, "UPLOADS_DIR", str(uploads_dir), raising=False)

    app_module.app.config["TESTING"] = True
    app_module.app.config["SECRET_KEY"] = "test-secret-key"

    return app_module


@pytest.fixture()
def client(app_module):
    return app_module.app.test_client()


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


def read_json(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def login_as_student(client):
    with client.session_transaction() as session:
        session["utilizador_id"] = 1
        session["utilizador_nome"] = "Aluno Teste"
        session["utilizador_nome_completo"] = "Aluno Teste"
        session["utilizador_email"] = "aluno@cabolearn.com"
        session["utilizador_tipo"] = "estudante"
        session["utilizador_avatar"] = "/assets/icons/inicio/perfil.png"


def login_as_teacher(client):
    with client.session_transaction() as session:
        session["utilizador_id"] = 2
        session["utilizador_nome"] = "Professor Teste"
        session["utilizador_nome_completo"] = "Professor Teste"
        session["utilizador_email"] = "professor@cabolearn.com"
        session["utilizador_tipo"] = "professor"
        session["utilizador_disciplina"] = "TIC"
        session["utilizador_avatar"] = "/assets/icons/inicio/perfil.png"


def post_upload(client, tarefa_id="1", filename="relatorio.pdf", content=b"conteudo teste"):
    return client.post(
        "/upload/submeter",
        data={
            "disciplina": "TIC",
            "tarefa_id": tarefa_id,
            "observacao": "Entrega feita pelo teste de integração",
            "autoria": "on",
            "ficheiro": (io.BytesIO(content), filename)
        },
        content_type="multipart/form-data",
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
    )


def test_login_com_credenciais_validas_redireciona_para_area_do_estudante(client):
    resposta = client.post(
        "/login",
        data={
            "email": "aluno@cabolearn.com",
            "password": "Aluno@2026"
        },
        follow_redirects=False
    )

    assert resposta.status_code in [302, 303]
    assert "/index" in resposta.headers["Location"] or resposta.headers["Location"].endswith("/")


def test_login_com_credenciais_invalidas_mostra_erro(client):
    resposta = client.post(
        "/login",
        data={
            "email": "aluno@cabolearn.com",
            "password": "senha-errada"
        }
    )

    assert resposta.status_code == 200
    assert "Email ou palavra passe incorretos".encode("utf-8") in resposta.data


def test_submissao_sem_autenticacao_bloqueia_e_redireciona_para_login(client):
    resposta = post_upload(client)

    assert resposta.status_code in [302, 303]
    assert "/login" in resposta.headers["Location"]


def test_professor_nao_pode_submeter_trabalho(client):
    login_as_teacher(client)

    resposta = post_upload(client)

    assert resposta.status_code == 403

    dados = resposta.get_json()
    assert dados["ok"] is False
    assert "Apenas estudantes" in dados["erro"]


def test_api_tarefas_retorna_apenas_tarefas_ativas_da_disciplina(client):
    login_as_student(client)

    resposta = client.get(
        "/api/tarefas?disciplina=TIC",
        headers={"Accept": "application/json"}
    )

    assert resposta.status_code == 200

    tarefas = resposta.get_json()

    ids = [tarefa["id"] for tarefa in tarefas]

    assert 1 in ids
    assert 2 in ids
    assert 3 not in ids


def test_submissao_bem_sucedida_guarda_ficheiro_submissao_notificacao_e_email(client, app_module):
    login_as_student(client)

    resposta = post_upload(client, tarefa_id="1", filename="relatorio.pdf")

    assert resposta.status_code == 201

    dados = resposta.get_json()

    assert dados["ok"] is True
    assert "Submissão registada com sucesso" in dados["mensagem"]

    submissoes = read_json(app_module.SUBMISSOES_FILE)
    notificacoes = read_json(app_module.NOTIFICACOES_FILE)
    emails = read_json(app_module.EMAILS_FILE)

    assert len(submissoes) == 1

    submissao = submissoes[0]

    assert submissao["aluno_id"] == 1
    assert submissao["professor_id"] == 2
    assert submissao["disciplina"] == "TIC"
    assert submissao["tarefa_titulo"] == "Trabalho de Integração"
    assert submissao["ficheiro_original"] == "relatorio.pdf"
    assert submissao["estado"] == "Entregue"
    assert submissao["atrasada"] is False
    assert submissao["minutos_atraso"] == 0

    assert len(notificacoes) == 2

    titulos = [notificacao["titulo"] for notificacao in notificacoes]

    assert "Nova submissão recebida" in titulos
    assert "Submissão enviada" in titulos

    assert len(emails) == 1

    email = emails[0]

    assert email["destinatario"] == "aluno@cabolearn.com"
    assert email["tipo"] == "confirmacao_submissao"
    assert email["estado"] == "simulado"
    assert "Confirmação de submissão" in email["assunto"]


def test_submissao_com_formato_invalido_e_rejeitada(client, app_module):
    login_as_student(client)

    resposta = post_upload(client, tarefa_id="1", filename="virus.exe")

    assert resposta.status_code == 400

    dados = resposta.get_json()

    assert dados["ok"] is False
    assert "Tipo de ficheiro inválido" in dados["erro"]
    assert ".pdf" in dados["erro"]
    assert ".docx" in dados["erro"]

    submissoes = read_json(app_module.SUBMISSOES_FILE)
    emails = read_json(app_module.EMAILS_FILE)

    assert submissoes == []
    assert emails == []


def test_submissao_fora_do_prazo_e_aceite_mas_marcada_como_atrasada(client, app_module):
    login_as_student(client)

    resposta = post_upload(client, tarefa_id="2", filename="atrasado.pdf")

    assert resposta.status_code == 201

    dados = resposta.get_json()

    assert dados["ok"] is True

    submissoes = read_json(app_module.SUBMISSOES_FILE)
    notificacoes = read_json(app_module.NOTIFICACOES_FILE)
    emails = read_json(app_module.EMAILS_FILE)

    assert len(submissoes) == 1

    submissao = submissoes[0]

    assert submissao["tarefa_titulo"] == "Trabalho Fora do Prazo"
    assert submissao["atrasada"] is True
    assert submissao["minutos_atraso"] > 0
    assert submissao["tempo_atraso"] is not None

    notificacao_professor = next(
        notificacao for notificacao in notificacoes
        if notificacao["destinatario_tipo"] == "professor"
    )

    assert "atrasada" in notificacao_professor["mensagem"].lower()

    email = emails[0]

    assert "atraso" in email["mensagem"].lower()


def test_submissao_com_tarefa_de_outra_disciplina_e_rejeitada(client, app_module):
    login_as_student(client)

    resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "Matemática",
            "tarefa_id": "1",
            "observacao": "",
            "ficheiro": (io.BytesIO(b"conteudo"), "relatorio.pdf")
        },
        content_type="multipart/form-data",
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
    )

    assert resposta.status_code == 400

    dados = resposta.get_json()

    assert dados["ok"] is False
    assert "não pertence à disciplina" in dados["erro"]

    submissoes = read_json(app_module.SUBMISSOES_FILE)

    assert submissoes == []


def test_submissao_sem_ficheiro_e_rejeitada(client, app_module):
    login_as_student(client)

    resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "TIC",
            "tarefa_id": "1",
            "observacao": ""
        },
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
    )

    assert resposta.status_code == 400

    dados = resposta.get_json()

    assert dados["ok"] is False
    assert "Selecione um ficheiro para realizar a submissão" in dados["erro"]

    submissoes = read_json(app_module.SUBMISSOES_FILE)

    assert submissoes == []