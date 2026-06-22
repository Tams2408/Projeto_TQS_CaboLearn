from unittest.mock import patch
from app import procurar_utilizador_por_email


def test_utilizador_existente():

    with patch("app.carregar_utilizadores") as mock:

        mock.return_value = [
            {
                "id": 1,
                "nome": "Elves",
                "email": "elves@cabolearn.com"
            }
        ]

        resultado = procurar_utilizador_por_email(
            "elves@cabolearn.com"
        )

        assert resultado is not None
        assert resultado["nome"] == "Elves"


def test_utilizador_inexistente():

    with patch("app.carregar_utilizadores") as mock:

        mock.return_value = []

        resultado = procurar_utilizador_por_email(
            "teste@test.com"
        )

        assert resultado is None


def test_email_case_insensitive():

    with patch("app.carregar_utilizadores") as mock:

        mock.return_value = [
            {
                "email": "ELVES@cabolearn.com"
            }
        ]

        resultado = procurar_utilizador_por_email(
            "elves@cabolearn.com"
        )

        assert resultado is not None