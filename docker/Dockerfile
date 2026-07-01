FROM python:3.12-slim

WORKDIR /app

# Instalar dependências primeiro para aproveitar a cache do Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código da aplicação (contexto de build = raiz do projeto)
COPY app.py .
COPY criar_utilizador.py .
COPY app/ app/
COPY data/ data/
COPY uploads/ uploads/

# Garantir que as pastas de dados/uploads/avatars existem dentro do container
RUN mkdir -p /app/uploads /app/app/assets/uploads/avatars

EXPOSE 5000

ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/login')" || exit 1

# Servidor de produção (gunicorn) a apontar para o objeto "app" definido em app.py
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]