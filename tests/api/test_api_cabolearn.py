import io
import json
import sys
import importlib.util
from pathlib import Path

import pytest


ROOT_DIR = Path(__file__).resolve().parents[2]
APP_FILE = ROOT_DIR / "app.py"

spec = importlib.util.spec_from_file_location("cabolearn_app", APP_FILE)
app_module = importlib.util.module_from_spec(spec)
sys.modules["cabolearn_app"] = app_module
spec.loader.exec_module(app_module)


@pytest.fixture()
def client(tmp_path, monkeypatch):
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
            "id": 3,
            "nome_completo": "Elves Garcia",
            "email": "elves.garcia@cabolearn.com",
            "tipo": "estudante",
            "avatar": "/assets/icons/inicio/perfil.png"
        },
        {
            "id": 2,
            "nome_completo": "João Ferreira",
            "email": "jferreira@cabolearn.com",
            "tipo": "professor",
            "disciplina": "Matemática"
        }
    ]

    tarefas = [
        {
            "id": 1,
            "titulo": "Relatório de Matemática",
            "disciplina": "Matemática",
            "professor_id": 2,
            "professor_nome": "João Ferreira",
            "prazo": "2099-12-31T23:59",
            "tipos_aceitos": [".pdf", ".docx"],
            "tamanho_maximo_mb": 5,
            "ativa": True
        },
        {
            "id": 2,
            "titulo": "Trabalho de Português",
            "disciplina": "Português",
            "professor_id": 2,
            "professor_nome": "João Ferreira",
            "prazo": "2099-12-31T23:59",
            "tipos_aceitos": [".pdf"],
            "tamanho_maximo_mb": 5,
            "ativa": True
        },
        {
            "id": 3,
            "titulo": "Tarefa inativa",
            "disciplina": "Matemática",
            "professor_id": 2,
            "professor_nome": "João Ferreira",
            "prazo": "2099-12-31T23:59",
            "tipos_aceitos": [".pdf"],
            "tamanho_maximo_mb": 5,
            "ativa": False
        }
    ]

    users_file.write_text(json.dumps(users, ensure_ascii=False), encoding="utf-8")
    tarefas_file.write_text(json.dumps(tarefas, ensure_ascii=False), encoding="utf-8")
    submissoes_file.write_text("[]", encoding="utf-8")
    notificacoes_file.write_text("[]", encoding="utf-8")
    emails_file.write_text("[]", encoding="utf-8")

    monkeypatch.setattr(app_module, "USERS_FILE", str(users_file), raising=False)
    monkeypatch.setattr(app_module, "TAREFAS_FILE", str(tarefas_file), raising=False)
    monkeypatch.setattr(app_module, "SUBMISSOES_FILE", str(submissoes_file), raising=False)
    monkeypatch.setattr(app_module, "NOTIFICACOES_FILE", str(notificacoes_file), raising=False)
    monkeypatch.setattr(app_module, "EMAILS_FILE", str(emails_file), raising=False)
    monkeypatch.setattr(app_module, "UPLOADS_DIR", str(uploads_dir), raising=False)

    app_module.app.config.update(
        TESTING=True,
        SECRET_KEY="teste-api-cabolearn"
    )

    with app_module.app.test_client() as client:
        with client.session_transaction() as session:
            session["utilizador_id"] = 3
            session["utilizador_nome"] = "Elves"
            session["utilizador_nome_completo"] = "Elves Garcia"
            session["utilizador_email"] = "elves.garcia@cabolearn.com"
            session["utilizador_tipo"] = "estudante"
            session["utilizador_avatar"] = "/assets/icons/inicio/perfil.png"

        client.submissoes_file = submissoes_file
        client.notificacoes_file = notificacoes_file
        client.emails_file = emails_file
        client.uploads_dir = uploads_dir

        yield client


def ler_json(caminho):
    return json.loads(Path(caminho).read_text(encoding="utf-8"))


def test_api_tarefas_retorna_apenas_tarefas_ativas_da_disciplina(client):
    resposta = client.get(
        "/api/tarefas?disciplina=Matemática",
        headers={"Accept": "application/json"}
    )

    assert resposta.status_code == 200

    dados = resposta.get_json()

    assert isinstance(dados, list)
    assert len(dados) == 1
    assert dados[0]["id"] == 1
    assert dados[0]["titulo"] == "Relatório de Matemática"
    assert dados[0]["disciplina"] == "Matemática"


def test_api_minha_submissao_retorna_false_quando_nao_existe(client):
    resposta = client.get(
        "/api/minha-submissao/1",
        headers={"Accept": "application/json"}
    )

    assert resposta.status_code == 200

    dados = resposta.get_json()

    assert dados["ok"] is True
    assert dados["existe"] is False
    assert dados["submissao"] is None


def test_upload_submeter_cria_nova_submissao(client):
    resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "Matemática",
            "tarefa_id": "1",
            "observacao": "Primeira submissão",
            "ficheiro": (io.BytesIO(b"conteudo fake do pdf"), "trabalho.pdf")
        },
        content_type="multipart/form-data",
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
    )

    assert resposta.status_code == 201

    dados = resposta.get_json()

    assert dados["ok"] is True
    assert "submissao" in dados
    assert dados["submissao"]["tarefa_id"] == 1
    assert dados["submissao"]["ficheiro_original"] == "trabalho.pdf"

    submissoes = ler_json(client.submissoes_file)

    assert len(submissoes) == 1
    assert submissoes[0]["aluno_id"] == 3
    assert submissoes[0]["tarefa_id"] == 1
    assert submissoes[0]["observacao"] == "Primeira submissão"
    assert submissoes[0]["estado"] == "Entregue"

    ficheiros_guardados = list(Path(client.uploads_dir).iterdir())

    assert len(ficheiros_guardados) == 1


def test_upload_submeter_mesma_tarefa_atualiza_submissao_existente(client):
    primeira_resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "Matemática",
            "tarefa_id": "1",
            "observacao": "Primeira versão",
            "ficheiro": (io.BytesIO(b"primeiro conteudo"), "primeiro.pdf")
        },
        content_type="multipart/form-data",
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
    )

    assert primeira_resposta.status_code == 201

    segunda_resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "Matemática",
            "tarefa_id": "1",
            "observacao": "Mensagem atualizada",
            "submissao_existente": "1"
        },
        content_type="multipart/form-data",
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
    )

    assert segunda_resposta.status_code == 201

    dados = segunda_resposta.get_json()

    assert dados["ok"] is True
    assert dados["submissao"]["observacao"] == "Mensagem atualizada"
    assert dados["submissao"]["estado"] == "Atualizado"

    submissoes = ler_json(client.submissoes_file)

    assert len(submissoes) == 1
    assert submissoes[0]["observacao"] == "Mensagem atualizada"
    assert submissoes[0]["estado"] == "Atualizado"
    assert submissoes[0]["ficheiro_original"] == "primeiro.pdf"


def test_api_minha_submissao_retorna_submissao_existente(client):
    client.post(
        "/upload/submeter",
        data={
            "disciplina": "Matemática",
            "tarefa_id": "1",
            "observacao": "Submissão para consulta",
            "ficheiro": (io.BytesIO(b"conteudo"), "consulta.pdf")
        },
        content_type="multipart/form-data",
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
    )

    resposta = client.get(
        "/api/minha-submissao/1",
        headers={"Accept": "application/json"}
    )

    assert resposta.status_code == 200

    dados = resposta.get_json()

    assert dados["ok"] is True
    assert dados["existe"] is True
    assert dados["submissao"]["ficheiro_original"] == "consulta.pdf"
    assert dados["submissao"]["observacao"] == "Submissão para consulta"


def test_upload_rejeita_formato_invalido(client):
    resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "Matemática",
            "tarefa_id": "1",
            "observacao": "Tentativa inválida",
            "ficheiro": (io.BytesIO(b"conteudo exe"), "virus.exe")
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
    assert "Tipo de ficheiro inválido" in dados["erro"]

    submissoes = ler_json(client.submissoes_file)

    assert len(submissoes) == 0


def test_upload_rejeita_tarefa_de_outra_disciplina(client):
    resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "Português",
            "tarefa_id": "1",
            "observacao": "Disciplina errada",
            "ficheiro": (io.BytesIO(b"conteudo"), "trabalho.pdf")
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


def test_upload_rejeita_tarefa_inativa(client):
    resposta = client.post(
        "/upload/submeter",
        data={
            "disciplina": "Matemática",
            "tarefa_id": "3",
            "observacao": "Tarefa inativa",
            "ficheiro": (io.BytesIO(b"conteudo"), "trabalho.pdf")
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
    assert "não está ativa" in dados["erro"]