def test_upload_sem_login(client):

    response = client.get(
        "/upload",
        follow_redirects=False
    )

    assert response.status_code == 302