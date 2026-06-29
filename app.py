from flask import Flask, render_template, request, redirect, session, url_for, jsonify, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
from datetime import datetime
import json
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "app", "html"),
    static_folder=os.path.join(BASE_DIR, "app"),
    static_url_path=""
)

app.secret_key= "cabolearn_chave_secreta_trocar_depois"

USERS_FILE= os.path.join(BASE_DIR, "data", "users.json")
TAREFAS_FILE = os.path.join(BASE_DIR, "data", "tarefas.json")
SUBMISSOES_FILE = os.path.join(BASE_DIR, "data", "submissoes.json")
NOTIFICACOES_FILE = os.path.join(BASE_DIR, "data", "notificacoes.json")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
EMAILS_FILE = os.path.join(BASE_DIR, "data", "emails.json")
<<<<<<< HEAD
AVATARS_DIR = os.path.join(BASE_DIR, "app", "assets", "uploads", "avatars")
AVATAR_EXT_PERMITIDAS = [".png", ".jpg", ".jpeg", ".webp"]
AVATAR_TAMANHO_MAXIMO_MB = 5
=======
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

PASSWORDS_COMUNS={
    "123456",
    "12345678",
    "123456789",
    "password",
    "senha",
    "senha123",
    "admin",
    "qwerty",
    "cabolearn",
    "cabolearn123"
}
<<<<<<< HEAD
def extensao_permitida_avatar(nome_ficheiro):
    extensao = os.path.splitext(nome_ficheiro.lower())[1]
    return extensao in AVATAR_EXT_PERMITIDAS

def tamanho_ficheiro_mb_generico(ficheiro):
    ficheiro.stream.seek(0, os.SEEK_END)
    tamanho_bytes = ficheiro.stream.tell()
    ficheiro.stream.seek(0)

    return tamanho_bytes / (1024 * 1024)
=======
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

def pedido_json():
    aceita_json= "application/json" in request.headers.get("Accept", "")
    ajax = request.headers.get("X-Request-With") == "XMLHttpRequest"

    return aceita_json or ajax

def resposta_erro_upload(mensagem, status=400):
    if pedido_json():
        return jsonify({
            "ok": False,
            "erro": mensagem
        }), status

    return mensagem, status

def resposta_sucesso_upload(mensagem, submissao):
    if pedido_json():
        return jsonify({
            "ok": True,
            "mensagem": mensagem,
            "submissao": submissao
        }), 201
    
    session["upload_sucesso"] = mensagem
    return redirect(url_for("submissoes"))

def registar_email(destinatario, assunto, mensagem, tipo="confirmacao_submissao", submissao_id=None):
    emails = carregar_json(EMAILS_FILE)

    novo_email={
        "id": gerar_proximo_id(emails),
        "destinatario": destinatario,
        "assunto": assunto,
        "mensagem": mensagem,
        "tipo": tipo,
        "submissao_id": submissao_id,
        "estado": "simulado",
        "criado_em": datetime.now().strftime("%d/%m/%Y %H:%M")
    }
    emails.append(novo_email)
    guardar_json(EMAILS_FILE, emails)

    return novo_email

def enviar_email_confirmacao_submissao(utilizador_email, utilizador_nome, submissao):
    assunto = "Confirmação de submissão - CaboLearn"

    mensagem = (
        f"Olá {utilizador_nome},\n\n"
        f"A sua submissão foi registada com sucesso.\n\n"
        f"Tarefa: {submissao.get('tarefa_titulo')}\n"
        f"Disciplina: {submissao.get('disciplina')}\n"
        f"Ficheiro: {submissao.get('ficheiro_original')}\n"
        f"Data de envio: {submissao.get('data_envio')}\n"
        f"Estado: {submissao.get('estado')}\n"
    )

    if submissao.get("atrasada"):
        mensagem += f"Atenção: a submissão foi enviada com {submissao.get('tempo_atraso')} de atraso.\n"

    mensagem += "\nCaboLearn"

    return registar_email(
        destinatario=utilizador_email,
        assunto=assunto,
        mensagem=mensagem,
        tipo="confirmacao_submissao",
        submissao_id=submissao.get("id")
    )

def obter_nome_completo(utilizador):
    return(
        utilizador.get("nome_completo")
        or utilizador.get("nome")
        or "Utilizador"
    )

def obter_nome_header(utilizador):
    nome_completo = obter_nome_completo(utilizador).strip()
    partes = nome_completo.split()

    if len(partes) == 1:
        return partes[0]
    
    return f"{partes[0]} {partes[-1]}"

def procurar_utilizadores_por_id(utilizador_id):
    utilizadores = carregar_utilizadores()

    for utilizador in utilizadores:
        if str(utilizadores.get("id")) == str(utilizador_id):
            return utilizador
    return None


def senha_contem_dados_pessoais(senha, utilizador):
    senha_lower = senha.lower()

    email_base = utilizador.get("email", "").split("@")[0].lower()
    nome = utilizador.get("nome", "").lower()
    nome_completo = utilizador.get("nome_completo", "").lower()

    partes_nome = re.split(r"\s+", f"{nome} {nome_completo}")

    if email_base and email_base in senha_lower:
        return True
    
    for parte in partes_nome:
        if len(parte) >= 3 and parte in senha_lower:
            return True
    return False

def validar_palavra_passe(senha, confirmar_senha=None, utilizador=None):
    erros = []

    if not senha:
        erros.append("Anova palavra-passe é obrigatória")
        return False, erros
    
    if confirmar_senha is not None and senha != confirmar_senha:
        erros.append("A confirmação da palavra passe não coincide")
    
    if len(senha) < 10:
        erros.append("A palavra passe deve ter pelo menos 10 caracteres.")
    
    if len(senha) > 72:
        erros.append("A palavra passe não deve ter mais de 72 caracteres.")
    
    if " " in senha:
        erros.append("A palavra passe não deve conter espaços.")
    
    if not re.search(r"[A-Z]", senha):
        erros.append("A palavra passe deve conter pelo menos uma letra maiúscula.")
    
    if not re.search(r"[a-z]", senha):
        erros.append("A palavra passe deve conter pelo menos uma letra minúscula.")
    
    if not re.search(r"[0-9]", senha):
        erros.append("A palavra passe deve conter pelo menos um número.")
    
    if not re.search(r"[!@#$%&*_\/-+=?.]", senha):
        erros.append("A palavra passe deve conter pelo menos um simbolo: ! @ # $ % & * _ - + = ? .")
    
    if senha.lower() in PASSWORDS_COMUNS:
        erros.append("A palavra passe escolhida é muito básica.")
    
    if utilizador:
        if senha_contem_dados_pessoais(senha, utilizador):
            erros.append("A palavra passe não deve conter nome, email ou dados pessoais.")
        
        if utilizador.get("password_hash") and check_password_hash(utilizador["password_hash"], senha):
            erros.append("A palavra passe não pode ser igual à atual.")
    
    return len(erros) == 0, erros

def validar_palavra_passe_admin(senha):
    erros = []
    
    if len(senha) < 10:
        erros.append("A palavra passe deve ter pelo menos 10 caracteres.")
    
    if " " in senha:
        erros.append("A palavra passe não deve conter espaços.")
    
    if not re.search(r"[A-Z]", senha):
        erros.append("A palavra passe deve conter pelo menos uma letra maiúscula.")
    
    if not re.search(r"[a-z]", senha):
        erros.append("A palavra passe deve conter pelo menos uma letra minúscula.")
    
    if not re.search(r"[0-9]", senha):
        erros.append("A palavra passe deve conter pelo menos um número.")
    
    if not re.search(r"[!@#$%&*_\-+=?.]", senha):
        erros.append("A palavra passe deve conter pelo menos um simbolo: ! @ # $ % & * _ - + = ? .")
    
    if senha.lower() in PASSWORDS_COMUNS:
        erros.append("A palavra passe escolhida é muito básica.")
    
    return len(erros) == 0, erros

def carregar_json(caminho):
    if not os.path.exists(caminho):
        return []
    
    with open(caminho, "r", encoding="utf-8") as file:
        try:
            return json.load(file)
        except json.JSONDecodeError:
            return []

def guardar_json(caminho, dados):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)

    with open(caminho, "w", encoding="utf-8") as file:
        json.dump(dados, file, indent=4, ensure_ascii=False)


def carregar_utilizadores():
    if not os.path.exists(USERS_FILE):
        return []
    
    with open(USERS_FILE, "r", encoding="utf-8") as file:
        try:
            return json.load(file)
        except json.JSONDecodeError:
            return []



def procurar_utilizador_por_email(email):
    utilizadores = carregar_utilizadores()

    for utilizador in utilizadores:
        if utilizador["email"].lower() == email.lower():
            return utilizador
    return None

def procurar_utilizador_id(utilizador_id):
    utilizadores = carregar_utilizadores()

    for utilizador in utilizadores:
        if utilizador.get("id") == utilizador_id:
            return utilizador
    
    return None

def normalizar_extensoes(texto):
    extensoes = []

    for item in texto.split(","):
        extensao = item.strip().lower()

        if not extensao:
            continue

        if not extensao.startswith("."):
            extensao = "." + extensao
        
        extensoes.append(extensao)
    return extensoes

def obter_extensao(nome_ficheiro):
    return os.path.splitext(nome_ficheiro.lower())[1]

def tamanho_ficheiro_mb(ficheiro):
    ficheiro.stream.seek(0, os.SEEK_END)
    tamanho_bytes = ficheiro.stream.tell()
    ficheiro.stream.seek(0)

    return tamanho_bytes / (1024 * 1024)




def criar_notificacao(destinatario_id, destinatario_tipo, titulo, mensagem, tipo, disciplina=None):
    notificacoes = carregar_json(NOTIFICACOES_FILE)

    nova_notificacao ={
        "id": gerar_proximo_id(notificacoes),
        "destinatario_id": destinatario_id,
        "destinatario_tipo": destinatario_tipo,
        "titulo": titulo,
        "mensagem": mensagem,
        "tipo": tipo,
        "disciplina": disciplina,
        "lida": False,
        "criada_em": datetime.now().strftime("%d/%m/%Y %H:%M")
    }

    notificacoes.append(nova_notificacao)
    guardar_json(NOTIFICACOES_FILE, notificacoes)

def criar_notificacao_para_estudantes(titulo, mensagem, tipo, disciplina=None):
    utilizadores = carregar_json(USERS_FILE)

    estudantes = [
        utilizador for utilizador in utilizadores
        if utilizador.get("tipo") == "estudante"
    ]

    for estudante in estudantes:
        criar_notificacao(
            destinatario_id=estudante["id"],
            destinatario_tipo="estudante",
            titulo=titulo,
            mensagem= mensagem,
            tipo = tipo,
            disciplina=disciplina
        )

def gerar_proximo_id(lista):
    if not lista:
        return 1
    maior_id = max(item.get("id", 0) for item in lista)
    return maior_id + 1


def login_obrigatorio(func):
    @wraps(func)
    def wrapper(*args,**kwargs):
        if "utilizador_id" not in session:
            return redirect(url_for("login"))
        return func(*args, **kwargs)
    return wrapper

def professor_obrigatorio(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if "utilizador_id" not in session:
            return redirect(url_for("login"))
        
        if session.get("utilizador_tipo") != "professor":
            return "Acesso negado. Esta página é apenas para professores.", 403
        
        return func(*args, **kwargs)
    return wrapper

def admin_obrigatorio(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if "utilizador_id" not in session:
            return redirect(url_for("login"))
        if session.get("utilizador_tipo") != "admin":
            return "Acesso negado. Esta página é restrita para administradores.", 403
        
        return func(*args, **kwargs)
    return wrapper

@app.route("/")
def raiz():
    if "utilizador_id" in session:
        if session.get("utilizador_tipo") == "admin":
            return redirect(url_for("admin"))
            
        if session.get("utilizador_tipo") == "professor":
            return redirect(url_for("professor_tarefas"))
        
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
            session["utilizador_nome_completo"] = obter_nome_completo(utilizador)
            session["utilizador_nome"] = obter_nome_header(utilizador)
            session["utilizador_email"] = utilizador["email"]
            session["utilizador_tipo"] = utilizador["tipo"]
            session["utilizador_disciplina"] = utilizador.get("disciplina")
<<<<<<< HEAD
            session["utilizador_avatar"] = utilizador.get("avatar", "/assets/img/avatar3.jpg")
=======
            session["utilizador_avatar"] = utilizador.get("avatar", "./assets/img/avatar3.jpg")
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

            if utilizador["tipo"] == "admin":
                return redirect(url_for("admin"))

            if utilizador["tipo"] == "professor":
                return redirect(url_for("professor_tarefas"))

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

@app.route("/professor/tarefas", methods=["GET", "POST"])
@professor_obrigatorio
def professor_tarefas():
    tarefas = carregar_json(TAREFAS_FILE)

    disciplina_professor = session.get("utilizador_disciplina")

    if not disciplina_professor:
        return "Oprofessor não tem disciplina definida", 400
    
    if request.method == "POST":
        titulo = request.form.get("titulo", "").strip()
        descricao = request.form.get("descricao", "").strip()
        prazo = request.form.get("prazo", "").strip()
        tipos_aceitos = request.form.get("tipos_aceitos", "").strip()
        tamanho_maximo = request.form.get("tamanho_maximo", "").strip()

        if not titulo or not prazo or not tipos_aceitos or not tamanho_maximo:
            return "Preencha todos os campos obrigatórios.", 400
        
        try:
            tamanho_maximo = float(tamanho_maximo)
        except ValueError:
            return "Otamanho máximo deve ser um número.", 400
    
        nova_tarefa = {
            "id": len(tarefas) + 1,
            "professor_id": session["utilizador_id"],
            "professor_nome": session["utilizador_nome"],
            "disciplina": disciplina_professor,
            "titulo": titulo,
            "descricao": descricao,
            "prazo": prazo,
            "tipos_aceitos": normalizar_extensoes(tipos_aceitos),
            "tamanho_maximo_mb": tamanho_maximo,
            "ativa": True,
            "criada_em": datetime.now().strftime("%d/%m/%Y %H:%M")
        }

        tarefas.append(nova_tarefa)
        guardar_json(TAREFAS_FILE, tarefas)

        criar_notificacao_para_estudantes(
            titulo="Nova tarefa publicada",
            mensagem=f"{session['utilizador_nome']} publicou a tarefa '{titulo}' em {disciplina_professor}.",
            tipo="tarefa",
            disciplina=disciplina_professor
        )

        return redirect(url_for("professor_tarefas"))
    
    minhas_tarefas =[
        tarefa for tarefa in tarefas
        if tarefa.get("professor_id") == session["utilizador_id"]
    ]

    return render_template(
        "professor_tarefas.html",
        tarefas=minhas_tarefas,
        disciplina_professor=disciplina_professor
    )

@app.route("/professor/tarefas/<int:tarefa_id>/alterar-estado", methods=["POST"])
@professor_obrigatorio
def alterar_estado_tarefa(tarefa_id):
    tarefas = carregar_json(TAREFAS_FILE)
    acao = request.form.get("acao", "").strip()

    for tarefa in tarefas:
        if(
            tarefa.get("id") == tarefa_id
            and tarefa.get("professor_id") == session["utilizador_id"]
        ):
            if acao == "desativar":
                tarefa["ativa"] = False
            elif acao == "ativar":
                tarefa["ativa"] = True

            guardar_json(TAREFAS_FILE, tarefas)
            return redirect(url_for("professor_tarefas"))
    
    return "Tarefa não encontrada ou sem permissão.", 404

@app.route("/professor/submissoes")
@professor_obrigatorio
def professor_submissoes():
    submissoes = carregar_json(SUBMISSOES_FILE)

    minhas_submissoes=[
        submissao for submissao in submissoes
        if submissao.get("professor_id") == session["utilizador_id"]
    ]

    minhas_submissoes=sorted(
        minhas_submissoes,
        key=lambda item: item.get("id", 0),
        reverse=True
    )

    return render_template(
        "professor_submissoes.html",
        submissoes=minhas_submissoes,
        professor_nome=session.get("utilizador_nome"),
        disciplina_professor=session.get("utilizador_disciplina")
    )

<<<<<<< HEAD
@app.route("/perfil/avatar", methods=["POST"])
@login_obrigatorio
def alterar_avatar():
    ficheiro = request.files.get("avatar")

    if not ficheiro or not ficheiro.filename:
        session["perfil_erro"] = "Selecione uma imagem para alterar a foto de perfil."
        return redirect(url_for("perfil"))

    nome_original = secure_filename(ficheiro.filename)

    if not extensao_permitida_avatar(nome_original):
        session["perfil_erro"] = "Formato inválido. Use PNG, JPG, JPEG ou WEBP."
        return redirect(url_for("perfil"))

    tamanho_mb = tamanho_ficheiro_mb_generico(ficheiro)

    if tamanho_mb > AVATAR_TAMANHO_MAXIMO_MB:
        session["perfil_erro"] = "A imagem deve ter no máximo 2 MB."
        return redirect(url_for("perfil"))

    os.makedirs(AVATARS_DIR, exist_ok=True)

    extensao = os.path.splitext(nome_original.lower())[1]
    nome_guardado = f"avatar_{session['utilizador_id']}{extensao}"

    caminho_guardado = os.path.join(AVATARS_DIR, nome_guardado)

    try:
        ficheiro.save(caminho_guardado)
    except Exception:
        session["perfil_erro"] = "Ocorreu uma falha ao guardar a imagem."
        return redirect(url_for("perfil"))

    caminho_avatar_web = f"/assets/uploads/avatars/{nome_guardado}"

    utilizadores = carregar_utilizadores()

    utilizador_encontrado = None

    for utilizador in utilizadores:
        if str(utilizador.get("id")) == str(session["utilizador_id"]):
            utilizador_encontrado = utilizador
            break

    if not utilizador_encontrado:
        session.clear()
        return redirect(url_for("login"))

    utilizador_encontrado["avatar"] = caminho_avatar_web

    guardar_json(USERS_FILE, utilizadores)

    session["utilizador_avatar"] = caminho_avatar_web
    session["perfil_sucesso"] = "Foto de perfil atualizada com sucesso."

    return redirect(url_for("perfil"))


=======
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
@app.route("/professor/submissoes/<int:submissao_id>/corrigir", methods=["POST"])
@professor_obrigatorio
def corrigir_submissao(submissao_id):
    submissoes= carregar_json(SUBMISSOES_FILE)

    estado = request.form.get("estado", "").strip()
    nota = request.form.get("nota", "").strip()
    feedback = request.form.get("feedback", "").strip()

    estados_validos= [
        "Entregue",
<<<<<<< HEAD
        "Atualizado",
=======
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        "Em análise",
        "Corrigido",
        "Com feedback",
        "Reenviar",
        "Rejeitado"
    ]

    if estado not in estados_validos:
        return "Estado inválido.", 400
    
    nota_final = None

    if nota:
        try:
            nota_final = float(nota)
        except ValueError:
            return "A nota deve ser um número", 400
        
        if nota_final < 0 or nota_final > 20:
            return "A nota deve estar entre 0 e 20.", 400
    
    for submissao in submissoes:
        if(
            submissao.get("id") == submissao_id
            and submissao.get("professor_id") == session["utilizador_id"]
        ):
            submissao["estado"]= estado
            submissao["nota"]= nota_final
            submissao["feedback"]= feedback
            submissao["corrigido_em"]= datetime.now().strftime("%d/%m/%Y %H;%M")

            guardar_json(SUBMISSOES_FILE, submissoes)

            criar_notificacao(
                destinatario_id=submissao["aluno_id"],
                destinatario_tipo="estudante",
                titulo="Submissão atualizada",
                mensagem=f"A sua submissão da tarefa '{submissao['tarefa_titulo']}' foi atualizada pelo professor",
                tipo="feedback",
                disciplina=submissao["disciplina"]
            )

            return redirect(url_for("professor_submissoes"))
    return "Submissão não encontrada ou sem permissão", 404
    
@app.route("/submissoes/<int:submissao_id>/baixar")
@login_obrigatorio
def baixar_ficheiro_aluno(submissao_id):
    submissoes = carregar_json(SUBMISSOES_FILE)

    for submissao in submissoes:
        pertence_ao_aluno=(
            session.get("utilizador_tipo") == "estudante"
            and submissao.get("aluno_id") == session["utilizador_id"]
        )

        pertence_ao_professor=(
            session.get("utilizador_tipo") == "professor"
            and submissao.get("professor_id") == session["utilizador_id"]
        )

        if submissao.get("id") == submissao_id and (pertence_ao_aluno or pertence_ao_professor):
            return send_from_directory(
                UPLOADS_DIR,
                submissao["ficheiro_guardado"],
                as_attachment=True,
                download_name=submissao["ficheiro_original"]
            )
    return "Ficheiro não encontrado ou sem permissão", 404


@app.route("/professor/submissoes/<int:submissao_id>/ficheiro")
@professor_obrigatorio
def ver_ficheiro_submissao(submissao_id):
    submissoes= carregar_json(SUBMISSOES_FILE)

    for submissao in submissoes:
        if(
            submissao.get("id") == submissao_id
            and submissao.get("professor_id")== session["utilizador_id"]
        ):
            return send_from_directory(
                UPLOADS_DIR,
                submissao["ficheiro_guardado"],
                as_attachment=False,
                download_name=submissao["ficheiro_original"]
            )
    return "Ficheiro não encontrado ou sem permissão", 404


@app.route("/professor/submissoes/<int:submissao_id>/baixar")
@professor_obrigatorio
def baixar_ficheiro_submissao(submissao_id):
    submissoes = carregar_json(SUBMISSOES_FILE)

    for submissao in submissoes:
        if (
            submissao.get("id") == submissao_id
            and submissao.get("professor_id") == session["utilizador_id"]
        ):
            return send_from_directory(
                UPLOADS_DIR,
                submissao["ficheiro_guardado"],
                as_attachment=True,
                download_name=submissao["ficheiro_original"]
            )
    return "Fcheiro não encontrado ou sem permissão", 404

@app.route("/upload/submeter", methods=["POST"])
@login_obrigatorio
def submeter_upload():
    if session.get("utilizador_tipo") != "estudante":
        return resposta_erro_upload("Apenas estudantes podem submeter trabalhos.", 403)

    disciplina = request.form.get("disciplina", "").strip()
    tarefa_id = request.form.get("tarefa_id", "").strip()
    observacao = request.form.get("observacao", "").strip()
    ficheiro = request.files.get("ficheiro")

<<<<<<< HEAD
    if not disciplina or not tarefa_id:
        return resposta_erro_upload("Selecione a disciplina e a tarefa.", 400)
=======
    if not disciplina or not tarefa_id or not ficheiro:
        return resposta_erro_upload("Dados incompletos para submissão.", 400)
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

    tarefas = carregar_json(TAREFAS_FILE)

    tarefa = next(
        (item for item in tarefas if str(item.get("id")) == str(tarefa_id)),
        None
    )

    if not tarefa:
        return resposta_erro_upload("Tarefa não encontrada.", 404)

    if tarefa.get("ativa") is not True:
        return resposta_erro_upload("Esta tarefa não está ativa.", 400)

    if tarefa.get("disciplina", "").lower() != disciplina.lower():
        return resposta_erro_upload("A tarefa selecionada não pertence à disciplina escolhida.", 400)

<<<<<<< HEAD
    submissoes = carregar_json(SUBMISSOES_FILE)

    submissao_existente = next(
        (
            item for item in submissoes
            if str(item.get("aluno_id")) == str(session["utilizador_id"])
            and str(item.get("tarefa_id")) == str(tarefa["id"])
        ),
        None
    )

    ficheiro_enviado = ficheiro is not None and ficheiro.filename and ficheiro.filename.strip()

    if not submissao_existente and not ficheiro_enviado:
        return resposta_erro_upload("Selecione um ficheiro para realizar a submissão.", 400)

    nome_original = None
    nome_guardado = None
    tamanho_mb = None

    if ficheiro_enviado:
        nome_original = secure_filename(ficheiro.filename)

        if not nome_original:
            return resposta_erro_upload("Nenhum ficheiro selecionado.", 400)

        extensao = obter_extensao(nome_original)
        tipos_aceitos = tarefa.get("tipos_aceitos", [])

        if extensao not in tipos_aceitos:
            return resposta_erro_upload(
                f"Tipo de ficheiro inválido. Tipos aceitos: {', '.join(tipos_aceitos)}",
                400
            )

        tamanho_mb = tamanho_ficheiro_mb(ficheiro)
        tamanho_maximo = float(tarefa.get("tamanho_maximo_mb", 0))

        if tamanho_mb > tamanho_maximo:
            return resposta_erro_upload(
                f"O ficheiro excede o limite de {tamanho_maximo} MB.",
                400
            )

        os.makedirs(UPLOADS_DIR, exist_ok=True)

        data_nome = datetime.now().strftime("%Y%m%d_%H%M%S")
        nome_guardado = f"{session['utilizador_id']}_{data_nome}_{nome_original}"

        caminho_guardado = os.path.join(UPLOADS_DIR, nome_guardado)

        try:
            ficheiro.save(caminho_guardado)
        except Exception:
            return resposta_erro_upload(
                "Ocorreu uma falha ao guardar o ficheiro. Tente submeter novamente.",
                500
            )

    dados_atraso = verificar_atraso_submissao(tarefa.get("prazo"))
    agora_formatado = datetime.now().strftime("%d/%m/%Y %H:%M")

    if submissao_existente:
        if ficheiro_enviado:
            submissao_existente["ficheiro_original"] = nome_original
            submissao_existente["ficheiro_guardado"] = nome_guardado
            submissao_existente["tamanho_mb"] = round(tamanho_mb, 2)

        submissao_existente["observacao"] = observacao
        submissao_existente["data_envio"] = agora_formatado
        submissao_existente["atualizado_em"] = agora_formatado
        submissao_existente["estado"] = "Atualizado"
        submissao_existente["nota"] = None
        submissao_existente["feedback"] = None
        submissao_existente["corrigido_em"] = None
        submissao_existente["atrasada"] = dados_atraso["atrasada"]
        submissao_existente["tempo_atraso"] = dados_atraso["tempo_atraso"]
        submissao_existente["minutos_atraso"] = dados_atraso["minutos_atraso"]
        submissao_existente["numero_edicoes"] = int(submissao_existente.get("numero_edicoes", 0)) + 1

        submissao_final = submissao_existente
        mensagem_sucesso = "Submissão atualizada com sucesso. Foi enviado um email de confirmação."
        titulo_notificacao_professor = "Submissão atualizada"

    else:
        nova_submissao = {
            "id": gerar_proximo_id(submissoes),
            "aluno_id": session["utilizador_id"],
            "aluno_nome": session.get("utilizador_nome_completo") or session.get("utilizador_nome"),
            "tarefa_id": tarefa["id"],
            "tarefa_titulo": tarefa["titulo"],
            "disciplina": tarefa["disciplina"],
            "professor_id": tarefa["professor_id"],
            "professor_nome": tarefa["professor_nome"],
            "prazo": tarefa.get("prazo"),
            "ficheiro_original": nome_original,
            "ficheiro_guardado": nome_guardado,
            "tamanho_mb": round(tamanho_mb, 2),
            "observacao": observacao,
            "data_envio": agora_formatado,
            "primeira_submissao_em": agora_formatado,
            "estado": "Entregue",
            "feedback": None,
            "nota": None,
            "atrasada": dados_atraso["atrasada"],
            "tempo_atraso": dados_atraso["tempo_atraso"],
            "minutos_atraso": dados_atraso["minutos_atraso"],
            "numero_edicoes": 0
        }

        submissoes.append(nova_submissao)

        submissao_final = nova_submissao
        mensagem_sucesso = "Submissão registada com sucesso. Foi enviado um email de confirmação."
        titulo_notificacao_professor = "Nova submissão recebida"

    guardar_json(SUBMISSOES_FILE, submissoes)

    mensagem_professor = (
        f"{session.get('utilizador_nome')} "
        f"{'atualizou' if submissao_existente else 'submeteu'} "
=======
    nome_original = secure_filename(ficheiro.filename)

    if not nome_original:
        return resposta_erro_upload("Nenhum ficheiro selecionado.", 400)

    extensao = obter_extensao(nome_original)
    tipos_aceitos = tarefa.get("tipos_aceitos", [])

    if extensao not in tipos_aceitos:
        return resposta_erro_upload(
            f"Tipo de ficheiro inválido. Tipos aceitos: {', '.join(tipos_aceitos)}",
            400
        )

    tamanho_mb = tamanho_ficheiro_mb(ficheiro)
    tamanho_maximo = float(tarefa.get("tamanho_maximo_mb", 0))

    if tamanho_mb > tamanho_maximo:
        return resposta_erro_upload(
            f"O ficheiro excede o limite de {tamanho_maximo} MB.",
            400
        )

    os.makedirs(UPLOADS_DIR, exist_ok=True)

    data_nome = datetime.now().strftime("%Y%m%d_%H%M%S")
    nome_guardado = f"{session['utilizador_id']}_{data_nome}_{nome_original}"

    caminho_guardado = os.path.join(UPLOADS_DIR, nome_guardado)

    try:
        ficheiro.save(caminho_guardado)
    except Exception:
        return resposta_erro_upload(
            "Ocorreu uma falha ao guardar o ficheiro. Tente submeter novamente.",
            500
        )

    submissoes = carregar_json(SUBMISSOES_FILE)

    dados_atraso = verificar_atraso_submissao(tarefa.get("prazo"))

    nova_submissao = {
        "id": gerar_proximo_id(submissoes),
        "aluno_id": session["utilizador_id"],
        "aluno_nome": session["utilizador_nome"],
        "tarefa_id": tarefa["id"],
        "tarefa_titulo": tarefa["titulo"],
        "disciplina": tarefa["disciplina"],
        "professor_id": tarefa["professor_id"],
        "professor_nome": tarefa["professor_nome"],
        "prazo": tarefa.get("prazo"),
        "ficheiro_original": nome_original,
        "ficheiro_guardado": nome_guardado,
        "tamanho_mb": round(tamanho_mb, 2),
        "observacao": observacao,
        "data_envio": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "estado": "Entregue",
        "feedback": None,
        "nota": None,
        "atrasada": dados_atraso["atrasada"],
        "tempo_atraso": dados_atraso["tempo_atraso"],
        "minutos_atraso": dados_atraso["minutos_atraso"]
    }

    submissoes.append(nova_submissao)
    guardar_json(SUBMISSOES_FILE, submissoes)

    mensagem_professor = (
        f"{session['utilizador_nome']} submeteu "
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        f"'{tarefa['titulo']}' em {tarefa['disciplina']}."
    )

    if dados_atraso["atrasada"]:
        mensagem_professor += f" Submissão atrasada em {dados_atraso['tempo_atraso']}."

    criar_notificacao(
        destinatario_id=tarefa["professor_id"],
        destinatario_tipo="professor",
<<<<<<< HEAD
        titulo=titulo_notificacao_professor,
=======
        titulo="Nova submissão recebida",
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        mensagem=mensagem_professor,
        tipo="submissao",
        disciplina=tarefa["disciplina"]
    )

    criar_notificacao(
        destinatario_id=session["utilizador_id"],
        destinatario_tipo="estudante",
<<<<<<< HEAD
        titulo="Submissão atualizada" if submissao_existente else "Submissão enviada",
        mensagem=f"A sua submissão da tarefa '{tarefa['titulo']}' foi atualizada com sucesso." if submissao_existente else f"A sua submissão da tarefa '{tarefa['titulo']}' foi registada com sucesso.",
=======
        titulo="Submissão enviada",
        mensagem=f"A sua submissão da tarefa '{tarefa['titulo']}' foi registada com sucesso.",
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        tipo="submissao",
        disciplina=tarefa["disciplina"]
    )

    enviar_email_confirmacao_submissao(
        utilizador_email=session.get("utilizador_email"),
        utilizador_nome=session.get("utilizador_nome"),
<<<<<<< HEAD
        submissao=submissao_final
    )

    return resposta_sucesso_upload(
        mensagem_sucesso,
        submissao_final
    )

@app.route("/api/minha-submissao/<int:tarefa_id>")
@login_obrigatorio
def api_minha_submissao(tarefa_id):
    if session.get("utilizador_tipo") != "estudante":
        return jsonify({
            "ok": False,
            "erro": "Apenas estudantes podem consultar a própria submissão."
        }), 403
    
    submissoes = carregar_json(SUBMISSOES_FILE)

    submissao = next(
        (
            item for item in submissoes
            if str(item.get("aluno_id")) == str(session["utilizador_id"])
            and str(item.get("tarefa_id")) == str(tarefa_id)
        ),
        None
    )

    if not submissao:
        return jsonify({
            "ok": True,
            "existe": False,
            "submissao": None
        })
    
    return jsonify({
        "ok": True,
        "existe": True,
        "submissao":{
            "id": submissao.get("id"),
            "tarefa_id": submissao.get("tarefa_id"),
            "tarefa_titulo": submissao.get("tarefa_titulo"),
            "disciplina": submissao.get("disciplina"),
            "ficheiro_original": submissao.get("ficheiro_original"),
            "tamanho_mb": submissao.get("tamanho_mb"),
            "observacao": submissao.get("observacao") or "",
            "data_envio": submissao.get("data_envio"),
            "estado": submissao.get("estado"),
            "atrasada": submissao.get("atrasada", False),
            "tempo_atraso": submissao.get("tempo_atraso")
        }
    })

=======
        submissao=nova_submissao
    )

    return resposta_sucesso_upload(
        "Submissão registada com sucesso. Foi enviado um email de confirmação.",
        nova_submissao
    )

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

@app.route("/api/tarefas")
@login_obrigatorio
def api_tarefas():
    disciplina = request.args.get("disciplina", "").strip()

    tarefas = carregar_json(TAREFAS_FILE)

    tarefas_ativas= [
        tarefa for tarefa in tarefas
        if tarefa.get("ativa") is True
    ]

    if disciplina:
        tarefas_ativas=[
            tarefa for tarefa in tarefas_ativas
            if tarefa.get("disciplina", "").lower() == disciplina.lower()
        ]
    return jsonify(tarefas_ativas)

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

@app.route("/api/submissoes")
@login_obrigatorio
def api_submissoes():
    submissoes = carregar_json(SUBMISSOES_FILE)

    if session.get("utilizador_tipo") == "professor":
        resultado = [
            submissao for submissao in submissoes
            if submissao.get("professor_id") == session["utilizador_id"]
        ]
    else:
        resultado = [
            submissao for submissao in submissoes
            if submissao.get("aluno_id") == session["utilizador_id"]
        ]
    resultado = sorted(resultado, key=lambda item: item.get("id", 0), reverse=True)
    return jsonify(resultado)

def converter_data_historico(valor):
    if not valor:
        return datetime.min
    
    formatos= [
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y %H;%M",
        "%Y-%m-%dT%H:%M"
    ]

    for formato in formatos:
        try:
            return datetime.strptime(valor, formato)
        except ValueError:
            pass
    return datetime.min

def converter_prazo_para_datetime(valor):
    if not valor:
        return None

    formatos= [
        "%Y-%m-%dT%H:%M",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y %H;%M",
        "%Y-%m-%d %H:%M"
    ]

    for formato in formatos:
        try:
            return datetime.strptime(valor, formato)
        except ValueError:
            pass
    return None

def formatar_tempo_atraso(diferenca):
    total_minutos = int(diferenca.total_seconds() // 60)

    if total_minutos <= 0:
        return ""
    
    dias = total_minutos // 1440
    resto = total_minutos % 1440
    horas = resto // 60
    minutos = resto % 60

    partes = []

    if dias > 0:
        partes.append(f"{dias} dia(s)")
    
    if horas > 0:
        partes.append(f"{horas} hora(s)")

    if minutos > 0 and dias == 0:
        partes.append(f"{minutos} minuto(s)")
    
    if not partes:
        return "menos de 1 minuto"
    
    return " e ".join(partes)

def verificar_atraso_submissao(prazo):
    prazo_datetime = converter_prazo_para_datetime(prazo)

    if not prazo_datetime:
        return {
            "atrasada": False,
            "tempo_atraso": None,
            "minutos_atraso": 0
        }
    
    agora = datetime.now()
    
    if agora <= prazo_datetime:
        return{
            "atrasada": False,
            "tempo_atraso": None,
            "minutos_atraso": 0
        }
    
    diferenca = agora - prazo_datetime
    return{
        "atrasada": True,
        "tempo_atraso": formatar_tempo_atraso(diferenca),
        "minutos_atraso": int(diferenca.total_seconds() // 60)
    }


def classe_status_historico(estado):
    valor = str(estado or "").lower()

    if "corrigido" in valor:
        return "evaluated"
    
    if "feedback" in valor:
        return "evaluated"
    
    if "rejeitado" in valor:
        return "pending"
    
    if "reenviar" in valor:
        return "pending"

    if "análise" in valor or "analise" in valor:
        return "present"
    
    if "entregue" in valor:
        return "done"
    
    return "viewed"

def classe_resultado_historico(nota):
    if nota is None:
        return "muted"
    
    try:
        nota = float(nota)
    except ValueError:
        return "muted"
    
    if nota >= 10:
        return "grade-good"
    
    return "pending"

@app.route("/api/historico")
@login_obrigatorio
def api_historico():
    submissoes = carregar_json(SUBMISSOES_FILE)
    notificacoes = carregar_json(NOTIFICACOES_FILE)

    utilizador_id = session["utilizador_id"]
    tipo_utilizador = session.get("utilizador_tipo")

    if tipo_utilizador == "professor":
        minhas_submissoes=[
            submissao for submissao in submissoes
            if str(submissao.get("professor_id")) == str(utilizador_id)
        ]
    else:
        minhas_submissoes=[
            submissao for submissao in submissoes
            if str(submissao.get("aluno_id")) == str(utilizador_id)
        ]

    minhas_notificacoes = [
        notificacao for notificacao in notificacoes
        if str(notificacao.get("destinatario_id")) == str(utilizador_id)
    ]

    atividades = []

    for submissao in minhas_submissoes:
        nota = submissao.get("nota")
        estado = submissao.get("estado", "Entregue")

        atividades.append({
            "id": f"submissao-{submissao.get('id')}",
            "tipo": "submissao",
            "icone": "pdf",
            "titulo": submissao.get("tarefa_titulo", "Trabalho submetido"),
            "descricao": submissao.get("ficheiro_original", "Ficheiro enviado"),
            "disciplina": submissao.get("disciplina", "—"),
            "professor": submissao.get("professor_nome", "—"),
            "data": submissao.get("data_envio", "—"),
            "resultado": nota if nota is not None else "—",
            "resultado_classe": classe_resultado_historico(nota),
            "estado": estado,
            "estado_classe": classe_status_historico(estado),
            "ordem": converter_data_historico(submissao.get("data_envio"))
        })

        if submissao.get("feedback") or submissao.get("corrigido_em"):
            atividades.append({
                "id": f"feedback-{submissao.get('id')}",
                "tipo": "feedback",
                "icone": "note",
                "titulo": "Feedback recebido",
                "descricao": submissao.get("feedback") or "Submissão atualizada pelo professor",
                "disciplina": submissao.get("disciplina", "—"),
                "professor": submissao.get("professor_nome", "—"),
                "data": submissao.get("corrigido_em") or submissao.get("data_envio", "—"),
                "resultado": nota if nota is not None else "—",
                "resultado_classe": classe_resultado_historico(nota),
                "estado": "Avaliado",
                "estado_classe": "evaluated",
                "ordem": converter_data_historico(
                    submissao.get("corrigido_em") or submissao.get("data_envio")
                )
            })


    for notificacao in minhas_notificacoes:
        tipo = notificacao.get("tipo") or notificacao.get("tipos") or "geral"

        if tipo in ["tarefa", "material", "feedback", "submissao"]:
            atividades.append({
                "id": f"notificacao-{notificacao.get('id')}",
                "tipo": tipo,
                "icone": "material" if tipo == "material" else "warning",
                "titulo": notificacao.get("titulo", "Notificação"),
                "descricao": notificacao.get("mensagem", ""),
                "disciplina": notificacao.get("disciplina", "—"),
                "professor": "Sistema",
                "data": notificacao.get("criada_em", "—"),
                "resultado": "—",
                "resultado_classe": "muted",
                "estado": "Visto" if notificacao.get("lida") else "Pendente",
                "estado_classe": "viewed" if notificacao.get("lida") else "pending",
                "ordem": converter_data_historico(notificacao.get("criada_em"))
            })

    atividades= sorted(
        atividades,
        key=lambda item: item["ordem"],
        reverse=True
    )

    total_atividades = len(atividades)

    total_submetidos = len(minhas_submissoes)

    total_corrigidos = len ([
        submissao for submissao in minhas_submissoes
        if submissao.get("nota") is not None or submissao.get("feedback")
    ])        

    notas = []

    for submissao in minhas_submissoes:
        if submissao.get("nota") is not None:
            try:
                notas.append(float(submissao.get("nota")))
            except ValueError:
                pass
    
    media = round(sum(notas) / len(notas), 1) if notas else 0

    disciplinas = {}

    for submissao in minhas_submissoes:
        disciplina= submissao.get("disciplina", "Sem disciplina")

        if disciplina not in disciplinas:
            disciplinas[disciplina]= {
                "disciplina": disciplina,
                "total": 0,
                "corrigidos": 0,
                "notas": []
            }
        
        disciplinas[disciplina]["total"] += 1

        if submissao.get("nota") is not None:
            disciplinas[disciplina]["Corrigidos"] += 1

            try:
                disciplinas[disciplina]["notas"].append(float(submissao.get("nota")))
            except ValueError:
                pass
    
    desempenho = []

    for item in disciplinas.values():
        if item["notas"]:
            media_disciplina= round(sum(item["notas"]) / len(item["notas"]), 1)
            percentagem = min(100, round((media_disciplina / 20) * 100))
        else:
            percentagem = 0
        
        desempenho.append({
            "disciplina": item["disciplina"],
            "percentagem": percentagem
        })
    
    feedbacks = [
        submissao for submissao in minhas_submissoes
        if submissao.get("feedback")
    ]

    feedbacks = sorted(
        feedbacks,
        key=lambda item: converter_data_historico(item.get("corrigido_em") or item.get("data_envio")),
        reverse=True
    )

    feedback_recente = None

    if feedbacks:
        ultimo = feedbacks[0]

        feedback_recente = {
            "tarefa": ultimo.get("tarefa_titulo", "Submissão"),
            "feedback": ultimo.get("feedback", ""),
            "professor": ultimo.get("professor_nome", "—"),
            "nota": ultimo.get("nota", "—")
        }

    return jsonify({
        "stats": {
            "atividades": total_atividades,
            "submissoes": total_submetidos,
            "corrigidos": total_corrigidos,
            "media": media
        },
        "atividades": atividades,
        "desempenho": desempenho,
        "feedback_recente": feedback_recente
    })


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

@app.route("/api/notificacoes")
@login_obrigatorio
def api_notificacoes():
    notificacoes = carregar_json(NOTIFICACOES_FILE)

    minhas_notificacoes= [
        notificacao for notificacao in notificacoes
        if str(notificacao.get("destinatario_id")) == str(session["utilizador_id"])
    ]

    minhas_notificacoes = sorted(
        minhas_notificacoes,
        key=lambda item: item.get("id", 0),
        reverse=True
    )
    return jsonify(minhas_notificacoes)

@app.route("/api/notificacoes/resumo")
@login_obrigatorio
def api_notificacoes_resumo():
    notificacoes = carregar_json(NOTIFICACOES_FILE)

    minhas_notificaoes =[
        notificacao for notificacao in notificacoes
        if str(notificacao.get("destinatario_id")) == str(session["utilizador_id"])
    ]

    total = len(minhas_notificaoes)

    nao_lidas = len([
        notificacao for notificacao in minhas_notificaoes
        if notificacao.get("lida") is False
    ])

    tarefas = len([
        notificacao for notificacao in minhas_notificaoes
        if (notificacao.get("tipo") or notificacao.get("tipos")) == "tarefa"
    ])

    materiais = len([
        notificacao for notificacao in minhas_notificaoes
        if (notificacao.get("tipo") or notificacao.get("tipos")) == "material"
    ])

    return jsonify({
        "total": total,
        "nao_lidas": nao_lidas,
        "tarefas": tarefas,
        "materiais": materiais
    })

@app.route("/api/notificacoes/<int:notificacao_id>/marcar-lida", methods=["POST"])
@login_obrigatorio
def marcar_notificacao_lida(notificacao_id):
    notificacoes = carregar_json(NOTIFICACOES_FILE)

    for notificacao in notificacoes:
        if(
            notificacao.get("id") == notificacao_id
            and str(notificacao.get("destinatario_id")) == str(session["utilizador_id"])
        ):
            notificacao["lida"] = True
            break
    
    guardar_json(NOTIFICACOES_FILE, notificacoes)

    return jsonify({"ok": True})



@app.route("/api/notificacoes/marcar-todas-lidas", methods=["POST"])
@login_obrigatorio
def marcar_todas_notificacoes_lidas():
    notificacoes = carregar_json(NOTIFICACOES_FILE)

    for notificacao in notificacoes:
        if notificacao.get("destinatario_id") == session["utilizador_id"]:
            notificacao["lida"] = True
    
    guardar_json(NOTIFICACOES_FILE, notificacoes)

    return jsonify({"ok": True})

@app.route("/perfil")
@app.route("/perfil.html")
@login_obrigatorio
def perfil():
    utilizador = procurar_utilizador_id(session["utilizador_id"])

    if not utilizador:
        session.clear()
        return redirect(url_for("login"))
    
    perfil_erro = session.pop("perfil_erro", None)
    perfil_sucesso = session.pop("perfil_sucesso", None)

    disciplinas_config ={
        "Matemática":{
            "classe": "math",
            "icone": "./assets/icons/perfil/Calculator.png"
        },
        "Português":{
            "classe": "port",
            "icone": "./assets/icons/perfil/Book.png"
        },
        "TIC":{
            "classe": "tic",
            "icone": "./assets/icons/perfil/Monitor.png"
        },
        "Inglês":{
            "classe": "eng",
            "icone": "./assets/icons/perfil/Geography.png"
        },
        "História":{
            "classe": "hist",
            "icone": "./assets/icons/perfil/Pillar.png"
        },
        "Física":{
            "classe": "fis",
            "icone": "./assets/icons/perfil/Physics.png"
        },
        "Biologia":{
            "classe": "bio",
            "icone": "./assets/icons/perfil/Planting.png"
        }
    }

    disciplinas_utilizador= []

    for nome_disciplina in utilizador.get("disciplinas", []):
        config = disciplinas_config.get(nome_disciplina, {
            "classe": "",
            "icone": "./assets/icons/sidebar/Books.png"
        })

        disciplinas_utilizador.append({
            "nome": nome_disciplina,
            "classe": config["classe"],
            "icone": config["icone"]
        })
    return render_template(
        "perfil.html",
        utilizador=utilizador,
        disciplinas=disciplinas_utilizador,
        perfil_erro=perfil_erro,
        perfil_sucesso=perfil_sucesso
        )

@app.route("/perfil/alterar-password", methods=["POST"])
@login_obrigatorio
def alterar_password():
    senha_atual = request.form.get("senha_atual", "").strip()
    nova_senha = request.form.get("nova_senha", "").strip()
    confirmar_senha = request.form.get("confirmar_senha", "").strip()

    utilizadores = carregar_utilizadores()

    utilizador_encontrado = None

    for utilizador in utilizadores:
        if str(utilizador.get("id")) == str(session["utilizador_id"]):
            utilizador_encontrado = utilizador
            break

    if not utilizador_encontrado:
        session.clear()
        return redirect(url_for("login"))
    
    if not check_password_hash(utilizador_encontrado["password_hash"], senha_atual):
        session["perfil_erro"] = "A palavra passe atual está incorreta."
        return redirect(url_for("perfil"))
    
    valido, erros = validar_palavra_passe(
        nova_senha,
        confirmar_senha,
        utilizador_encontrado
    )

    if not valido:
        session["perfil_erro"] = " ".join(erros)
        return redirect(url_for("perfil"))
    
    utilizador_encontrado["password_hash"] = generate_password_hash(nova_senha)
    utilizador_encontrado["password_alteracao"] = datetime.now().strftime("%d%m%Y %H:%M")

    guardar_json(USERS_FILE, utilizadores)

    session["perfil_sucesso"] = "Palavra-passe alterada com sucesso."

    return redirect(url_for("perfil"))

@app.route("/admin", methods=["GET", "POST"])
@admin_obrigatorio
def admin():
    mensagem = None
    erro = None

    if request.method == "POST":
        dados = {
            "nome_completo": request.form.get("nome_completo", "").strip(),
            "email": request.form.get("email", "").strip(),
            "senha": request.form.get("senha", "").strip(),
            "tipo": request.form.get("tipo", "").strip(),
            "disciplina": request.form.get("disciplina", "").strip(),
            "telefone": request.form.get("telefone", "").strip(),
            "data_nascimento": request.form.get("data_nascimento", "").strip(),
            "ano_escolaridade": request.form.get("ano_escolaridade", "").strip(),
            "turma": request.form.get("turma", "").strip(),
            "ano_letivo": request.form.get("ano_letivo", "").strip(),
            "numero_aluno": request.form.get("numero_aluno", "").strip(),
            "professor_diretor_id": request.form.get("professor_diretor_id", "").strip(),
            "instituicao": request.form.get("instituicao", "").strip(),
            "disciplinas": request.form.getlist("disciplinas")
        }

        if not dados["nome_completo"] or not dados["email"] or not dados["senha"] or not dados["tipo"]:
            erro = "Preencha os campos obrigatórios."

        elif dados["tipo"] == "professor" and not dados["disciplina"]:
            erro = "Professor precisa ter uma disciplina definida."

        else:
            sucesso, resposta = criar_utilizador_admin(dados)

            if sucesso:
                mensagem = resposta
            else:
                erro = resposta

    utilizadores = carregar_utilizadores()

    professores = [
        utilizador for utilizador in utilizadores
        if utilizador.get("tipo") == "professor"
    ]

    professores =sorted(
        professores,
        key=lambda item: obter_nome_completo(item).lower()
    )

    utilizadores_ordenados = sorted(
        utilizadores,
        key=lambda item: item.get("id", 0),
        reverse=True
    )

    return render_template(
        "admin.html",
        utilizadores=utilizadores_ordenados,
        professores=professores,
        mensagem=mensagem,
        erro=erro
    )

def criar_utilizador_admin(dados):
    utilizadores = carregar_utilizadores()

    email = dados.get("email", "").strip().lower()
    tipo = dados.get("tipo", "").strip()

    for utilizador in utilizadores:
        if utilizador.get("email", "").lower() == email:
            return False, "Este email já existe."

    senha_valida, erros_senha = validar_palavra_passe_admin(dados.get("senha", ""))

    if not senha_valida:
        return False, "Palavra-passe fraca: " + ", ".join(erros_senha) + "."

    novo_utilizador = {
        "id": gerar_proximo_id(utilizadores),
        "nome_completo": dados.get("nome_completo", "").strip(),
        "email": email,
        "password_hash": generate_password_hash(dados.get("senha", "")),
        "tipo": tipo
    }

    if tipo == "professor":
        novo_utilizador["disciplina"] = dados.get("disciplina", "").strip()

    elif tipo == "estudante":
        professor_diretor_id = dados.get("professor_diretor_id", "").strip()
        professor_diretor_nome = ""

        if professor_diretor_id:
            for utilizador in utilizadores:
                if (
                    str(utilizador.get("id")) == str(professor_diretor_id)
                    and utilizador.get("tipo") == "professor"
                ):
                    professor_diretor_nome = obter_nome_completo(utilizador)
                    break

        novo_utilizador["telefone"] = dados.get("telefone", "").strip()
        novo_utilizador["data_nascimento"] = dados.get("data_nascimento", "").strip()
        novo_utilizador["ano_escolaridade"] = dados.get("ano_escolaridade", "").strip()
        novo_utilizador["turma"] = dados.get("turma", "").strip()
        novo_utilizador["ano_letivo"] = dados.get("ano_letivo", "").strip()
        novo_utilizador["numero_aluno"] = dados.get("numero_aluno", "").strip()
        novo_utilizador["professor_diretor_id"] = professor_diretor_id
        novo_utilizador["professor_diretor"] = professor_diretor_nome
        novo_utilizador["instituicao"] = dados.get("instituicao", "").strip()
        novo_utilizador["estado"] = "Ativo"
        novo_utilizador["categoria"] = "Aluno regular"
        novo_utilizador["disciplinas"] = dados.get("disciplinas", [])

    utilizadores.append(novo_utilizador)
    guardar_json(USERS_FILE, utilizadores)

    return True, "Utilizador criado com sucesso."

if __name__ == "__main__":
    app.run(debug=True)