def test_get_login(client):

    response = client.get("/login")

    assert response.status_code == 200


def test_upload_sem_login(client):

    response = client.get(
        "/upload",
        follow_redirects=False
    )

    assert response.status_code == 302


def test_historico_sem_login(client):

    response = client.get(
        "/historico",
        follow_redirects=False
    )

    assert response.status_code == 302


def test_index_sem_login(client):

    response = client.get(
        "/index",
        follow_redirects=False
    )

    assert response.status_code == 302