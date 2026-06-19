import json
import os
from werkzeug.security import generate_password_hash

USERS_FILE = "data/users.json"

def carregar_utilizadores():
    if not os.path.exists(USERS_FILE):
        return []
    
    with open(USERS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def guardar_utilizadores(utilizadores):
    os.makedirs("data", exist_ok=True)

    with open(USERS_FILE, "w", encoding="utf-8") as file:
        json.dump(utilizadores, file, indent=4, ensure_ascii=False)


def criar_utilizador(nome, email, senha, tipo="estudante"):
    utilizadores= carregar_utilizadores()

    for utilizador in utilizadores:
        if utilizador["email"] == email:
            print("Este email já existe.")
            return
        
    novo_utilizador={
        "id": len(utilizadores) + 1,
        "nome": nome,
        "email": email,
        "password_hash": generate_password_hash(senha),
        "tipo": tipo
    }

    utilizadores.append(novo_utilizador)
    guardar_utilizadores(utilizadores)
    print("Utilizador criado com sucesso")

criar_utilizador(
    nome= "Elves Garcia",
    email="elves@cabolearn.com",
    senha="123456",
    tipo="estudante"
)