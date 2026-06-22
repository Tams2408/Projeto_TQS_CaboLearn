from flask import Flask, render_template, request, redirect, session, url_for
from werkzeug.security import check_password_hash
from functools import wraps
import json
import os

app = Flask(
    __name__,
    template_folder="app",
    static_folder="app",
    static_url_path=""
)

app.secret_key= "cabolearn_chave_secreta_trocar_depois"

USERS_FILE= "data/users.json"

def carregar_utilizadores():
    if not os.path.exists(USERS_FILE):
        return []
    
    with open(USERS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)
    

def procurar_utilizador_por_email(email):
    utilizadores = carregar_utilizadores()
    for utilizador in utilizadores:
        if utilizador["email"].lower() == email.lower():
            return utilizador
    return None


def login_obrigatorio(func):
    @wraps(func)
    def wrapper(*args,**kwargs):
        if "utilizador_id" not in session:
            return redirect(url_for("login"))
        return func(*args, **kwargs)
    return wrapper


@app.route("/")
def raiz():
    if "utilizador_id" in session:
        return redirect(url_for("index"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
@app.route("/login.html", methods=["GET", "POST"])
def login():
    erro = None

    if request.method == "POST":
        email = request.form.get("email", "").strip()
        senha = request.form.get("password", "").strip()

        utilizador = procurar_utilizador_por_email(email)

        if utilizador and check_password_hash(utilizador["password_hash"], senha):
            session["utilizador_id"] = utilizador["id"]
            session["utilizador_nome"] = utilizador["nome"]
            session["utilizador_email"] = utilizador["email"]
            session["utilizador_tipo"] = utilizador["tipo"]

            return redirect(url_for("index"))
        erro = "Email ou palavra passe incorretos."
    return render_template("login.html", erro=erro)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/index")
@app.route("/index.html")
@login_obrigatorio
def index():
    return render_template("index.html")


@app.route("/disciplinas")
@app.route("/disciplinas.html")
@login_obrigatorio
def disciplinas():
    return render_template("disciplinas.html")


@app.route("/upload")
@app.route("/upload.html")
@login_obrigatorio
def upload():
    return render_template("upload.html")


@app.route("/submissoes")
@app.route("/submissoes.html")
@login_obrigatorio
def submissoes():
    return render_template("submissoes.html")


@app.route("/historico")
@app.route("/historico.html")
@login_obrigatorio
def historico():
    return render_template("historico.html")


@app.route("/notificacoes")
@app.route("/notificacoes.html")
@login_obrigatorio
def notificacoes():
    return render_template("notificacoes.html")


@app.route("/perfil")
@app.route("/perfil.html")
@login_obrigatorio
def perfil():
    return render_template("perfil.html")

if __name__ == "__main__":
    app.run(debug=True)