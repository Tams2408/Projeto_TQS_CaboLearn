document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("upload-form");
    const alertBox = document.getElementById("upload-alert");
    const offlineStatus = document.getElementById("offline-status");
    const submitBtn = document.querySelector(".btn-submit");

    const DB_NAME = "cabolearn_offline_db";
    const DB_VERSION = 1;
    const STORE_NAME = "submissoes_pendentes";

    let sincronizando = false;

    function mostrarMensagem(tipo, mensagem) {
        if (!alertBox) return;

        alertBox.textContent = mensagem;
        alertBox.className = "upload-alert";
        alertBox.classList.add(tipo);

        setTimeout(() => {
            alertBox.classList.add("hidden");
        }, 6000);
    }

    function atualizarEstadoOnline() {
        if (!offlineStatus) return;

        if (navigator.onLine) {
            offlineStatus.classList.add("hidden");
        } else {
            offlineStatus.classList.remove("hidden");
        }
    }

    function definirCarregando(ativo) {
        if (!submitBtn) return;

        if (ativo) {
            submitBtn.disabled = true;
            submitBtn.classList.add("loading");
            submitBtn.querySelector("span").textContent = "A submeter...";
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            submitBtn.querySelector("span").textContent = "Submeter trabalho";
        }
    }

    function abrirDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {
                        keyPath: "id",
                        autoIncrement: true
                    });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function guardarSubmissaoOffline(formData) {
        const db = await abrirDB();

        const ficheiro = formData.get("ficheiro");

        const submissaoOffline = {
            disciplina: formData.get("disciplina"),
            tarefa_id: formData.get("tarefa_id"),
            observacao: formData.get("observacao") || "",
            autoria: formData.get("autoria") || "",
            ficheiro: ficheiro,
            ficheiro_nome: ficheiro ? ficheiro.name : "",
            criada_em: new Date().toISOString(),
            estado: "pendente"
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);

            const request = store.add(submissaoOffline);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function listarSubmissoesPendentes() {
        const db = await abrirDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async function removerSubmissaoPendente(id) {
        const db = await abrirDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);

            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    function criarFormDataDaSubmissaoPendente(item) {
        const formData = new FormData();

        formData.append("disciplina", item.disciplina);
        formData.append("tarefa_id", item.tarefa_id);
        formData.append("observacao", item.observacao || "");

        if (item.autoria) {
            formData.append("autoria", item.autoria);
        }

        formData.append("ficheiro", item.ficheiro, item.ficheiro_nome);

        return formData;
    }

    async function enviarFormData(formData) {
        const resposta = await fetch("/upload/submeter", {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const contentType = resposta.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error("A sessão pode ter expirado. Faça login novamente.");
        }

        const dados = await resposta.json();

        if (!resposta.ok || dados.ok === false) {
            throw new Error(dados.erro || "Não foi possível concluir a submissão.");
        }

        return dados;
    }

    async function sincronizarPendentes() {
        if (sincronizando || !navigator.onLine) return;

        sincronizando = true;

        try {
            const pendentes = await listarSubmissoesPendentes();

            if (pendentes.length === 0) {
                sincronizando = false;
                return;
            }

            for (const item of pendentes) {
                try {
                    const formData = criarFormDataDaSubmissaoPendente(item);

                    await enviarFormData(formData);
                    await removerSubmissaoPendente(item.id);

                    mostrarMensagem(
                        "success",
                        `Submissão pendente "${item.ficheiro_nome}" sincronizada com sucesso.`
                    );

                } catch (erro) {
                    console.error("Erro ao sincronizar submissão pendente:", erro);
                    break;
                }
            }

        } catch (erro) {
            console.error("Erro geral na sincronização offline:", erro);
        }

        sincronizando = false;
    }

    async function submeterOnline(formData) {
        definirCarregando(true);

        try {
            const dados = await enviarFormData(formData);

            mostrarMensagem("success", dados.mensagem || "Submissão realizada com sucesso.");

            form.reset();

            setTimeout(() => {
                window.location.href = "/submissoes";
            }, 1400);

        } catch (erro) {
            console.error("Falha durante upload:", erro);

            if (!navigator.onLine || erro instanceof TypeError) {
                await guardarSubmissaoOffline(formData);

                mostrarMensagem(
                    "warning",
                    "Sem ligação ou falha de rede. A submissão foi guardada localmente e será sincronizada automaticamente."
                );
            } else {
                mostrarMensagem("error", erro.message);
            }

        } finally {
            definirCarregando(false);
        }
    }

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const formData = new FormData(form);
            const ficheiro = formData.get("ficheiro");

            if (!formData.get("disciplina") || !formData.get("tarefa_id") || !ficheiro || !ficheiro.name) {
                mostrarMensagem("error", "Selecione a disciplina, a tarefa e o ficheiro antes de submeter.");
                return;
            }

            if (!navigator.onLine) {
                await guardarSubmissaoOffline(formData);

                mostrarMensagem(
                    "warning",
                    "Está sem internet. A submissão foi guardada localmente e ficará pendente de sincronização."
                );

                return;
            }

            await submeterOnline(formData);
        });
    }

    window.addEventListener("online", () => {
        atualizarEstadoOnline();
        sincronizarPendentes();
    });

    window.addEventListener("offline", atualizarEstadoOnline);

    atualizarEstadoOnline();
    sincronizarPendentes();

    setInterval(sincronizarPendentes, 15000);
});