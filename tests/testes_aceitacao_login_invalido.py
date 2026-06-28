def test_login_invalido(client):

    response = client.post(
        "/login",
        data={
            "email":"teste@test.com",
            "password":"123"
        }
    )

    assert b"incorretos" in response.data