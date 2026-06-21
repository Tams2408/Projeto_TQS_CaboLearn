import json
import pytest
from werkzeug.security import generate_password_hash

import app as cabolearn_app

@pytest.fixture()
def client(tmp_path, monkeypatch):
    """
    Cria um ambiente de teste isolado.
    Cria um users.json temporário e força o app.py a usar esse ficheiro.
    """

    users_file = tmp_path / "users.json"

    utilizadores_teste= [
        {
            "id": 1,
            "nome": "Elves Garcia",
            "email": "elves@cabolearn.com",
            "password_hash": generate_password_hash("123456"),
            "tipo": "estudante"
        }
    ]

    users_file.write_text(
        json.dumps(utilizadores_teste, indent=4, ensure_ascii=False),
        encoding="utf-8"
    )    

    monkeypatch.setattr(cabolearn_app, "USERS_FILE", str(users_file), raising=False)

    cabolearn_app.app.config.update(
        TESTING =True,
        SECRET_KEY="chave_teste"
    )

    with cabolearn_app.app.test_client() as client:
        yield client


def fazer_login(client, email="elves@cabolearn.com", senha="123456"):
    """
    Envia password e senha para cobrir os dois possiveis nomes de campo.
    """

    return client.post(
        "/login",
        data={
            "email": email,
            "password": senha,
            "senha": senha
        },
        follow_redirects=False
    )


def test_login_com_dados_corretos_redireciona_para_index(client):
    resposta = fazer_login(client)

    assert resposta.status_code in [302, 303]
    assert "/index" in resposta.headers.get("Location", "")


def test_login_com_dados_errados_permanece_no_login(client):
    resposta = fazer_login(
        client,
        email ="elves@cabolearn.com",
        senha= "senha_errada"
    )

    assert resposta.status_code == 200

    html = resposta.data.decode("utf-8").lower()

    assert "entrar" in html
    assert "incorrect" in html or "email" in html


def test_pagina_protegida_redireciona_sem_login(client):
    resposta = client.get("/upload", follow_redirects=False)

    assert resposta.status_code in [302, 303]
    assert "/login" in resposta.headers.get("Location", "")


def test_acesso_a_pagina_protegida_depois_do_login(client):
    resposta_login = fazer_login(client)

    assert resposta_login.status_code in [302, 303]

    resposta = client.get("/upload", follow_redirects=False)

    assert resposta.status_code == 200
    assert b"Upload" in resposta.data


def test_logout_limpa_sessao_e_bloqueia_index(client):
    resposta_login = fazer_login(client)

    assert resposta_login.status_code in [302, 303]

    resposta_logout = client.get("/logout", follow_redirects=False)

    assert resposta_logout.status_code in [302, 303]
    assert "/login" in resposta_logout.headers.get("Location", "")


@pytest.mark.parametrize("rota", [
    "/index",
    "/disciplinas",
    "/upload",
    "/submissoes",
    "/historico",
    "/notificacoes",
    "/perfil",
])

def test_todas_as_paginas_principais_exigem_login(client, rota):
    resposta = client.get(rota, follow_redirects=False)

    assert resposta.status_code in [302, 303]
    assert "/login" in resposta.headers.get("Location", "")