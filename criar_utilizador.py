import json
import os
from werkzeug.security import generate_password_hash

USERS_FILE = "data/users.json"

os.makedirs("data", exist_ok=True)

if os.path.exists(USERS_FILE):
    with open(USERS_FILE, "r", encoding="utf-8") as file:
        try:
            utilizadores = json.load(file)
        except json.JSONDecodeError:
            utilizadores = []
else:
    utilizadores = []

for utilizador in utilizadores:
    if utilizador.get("email") == "admin@cabolearn.com":
        print("Admin já existe.")
        break
else:
    utilizadores.append({
        "id": max([u.get("id", 0) for u in utilizadores], default=0) + 1,
        "nome_completo": "Administrador CaboLearn",
        "email": "admin@cabolearn.com",
        "password_hash": generate_password_hash("Admin@2026"),
        "tipo": "admin",
        "avatar": "./assets/img/avatar.jpg"
    })

    with open(USERS_FILE, "w", encoding="utf-8") as file:
        json.dump(utilizadores, file, indent=4, ensure_ascii=False)

    print("Admin criado com sucesso.")