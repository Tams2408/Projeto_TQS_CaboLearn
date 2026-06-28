def test_aceitacao_acesso_sem_login(client):

    response = client.get(
        "/disciplinas",
        follow_redirects=False
    )

    assert response.status_code == 302
    assert "/login" in response.location