document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("notifications-list");
    const marcarTodasBtn = document.getElementById("mark-all-read-btn");

    const countTodas = document.getElementById("count-todas");
    const countNaoLidas = document.getElementById("count-nao-lidas");
    const countMateriais = document.getElementById("count-materiais");
    const countTarefas = document.getElementById("count-tarefas");

    const filterButtons = document.querySelectorAll(".filter-btn");

    let notificacoes = [];
    let filtroAtual = "todas";

    function escaparHTML(valor) {
        if (valor === null || valor === undefined) return "";

        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function obterTipo(notificacao) {
        return notificacao.tipo || notificacao.tipos || "geral";
    }

    function atualizarContadores() {
        const total = notificacoes.length;

        const naoLidas = notificacoes.filter(
            notificacao => notificacao.lida === false
        ).length;

        const materiais = notificacoes.filter(
            notificacao => obterTipo(notificacao) === "material"
        ).length;

        const tarefas = notificacoes.filter(
            notificacao => obterTipo(notificacao) === "tarefa"
        ).length;

        if (countTodas) countTodas.textContent = total;
        if (countNaoLidas) countNaoLidas.textContent = naoLidas;
        if (countMateriais) countMateriais.textContent = materiais;
        if (countTarefas) countTarefas.textContent = tarefas;
    }

    function filtrarNotificacoes() {
        if (filtroAtual === "todas") {
            return notificacoes;
        }

        if (filtroAtual === "nao_lidas") {
            return notificacoes.filter(notificacao => notificacao.lida === false);
        }

        return notificacoes.filter(
            notificacao => obterTipo(notificacao) === filtroAtual
        );
    }

    function classeTipo(notificacao) {
        const tipo = obterTipo(notificacao);

        if (tipo === "tarefa") return "task";
        if (tipo === "material") return "material";
        if (tipo === "feedback") return "feedback";
        if (tipo === "submissao") return "submission";

        return "general";
    }

    function renderizarNotificacoes() {
        if (!lista) return;

        atualizarContadores();

        const resultado = filtrarNotificacoes();

        if (resultado.length === 0) {
            lista.innerHTML = `
                <div class="empty-row">
                    Nenhuma notificação encontrada.
                </div>
            `;
            return;
        }

        lista.innerHTML = resultado.map((notificacao) => {
            const naoLida = notificacao.lida === false;

            return `
                <article class="notification-row ${naoLida ? "unread" : "read"}">
                    <div class="notification-icon-box ${classeTipo(notificacao)}">
                        🔔
                    </div>

                    <div class="notification-content">
                        <p>
                            <strong>${escaparHTML(notificacao.titulo)}</strong>:
                            ${escaparHTML(notificacao.mensagem)}
                        </p>

                        <span>${escaparHTML(notificacao.criada_em || "")}</span>
                    </div>

                    ${
                        naoLida
                            ? `
                                <button 
                                    class="read-small-btn" 
                                    type="button" 
                                    data-id="${notificacao.id}"
                                    title="Marcar como lida"
                                >
                                    ●
                                </button>
                            `
                            : `
                                <span class="read-dot"></span>
                            `
                    }
                </article>
            `;
        }).join("");

        document.querySelectorAll(".read-small-btn").forEach((botao) => {
            botao.addEventListener("click", async () => {
                const id = botao.dataset.id;

                await marcarComoLida(id);
            });
        });
    }

    async function carregarNotificacoes() {
        try {
            const resposta = await fetch("/api/notificacoes", {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!resposta.ok) {
                console.error("Erro ao carregar notificações:", resposta.status);
                return;
            }

            notificacoes = await resposta.json();

            renderizarNotificacoes();

        } catch (erro) {
            console.error("Erro de ligação ao carregar notificações:", erro);

            if (lista) {
                lista.innerHTML = `
                    <div class="empty-row">
                        Erro ao carregar notificações.
                    </div>
                `;
            }
        }
    }

    async function marcarComoLida(id) {
        try {
            await fetch(`/api/notificacoes/${id}/marcar-lida`, {
                method: "POST"
            });

            await carregarNotificacoes();

        } catch (erro) {
            console.error("Erro ao marcar notificação como lida:", erro);
        }
    }

    async function marcarTodasComoLidas() {
        try {
            await fetch("/api/notificacoes/marcar-todas-lidas", {
                method: "POST"
            });

            await carregarNotificacoes();

        } catch (erro) {
            console.error("Erro ao marcar todas como lidas:", erro);
        }
    }

    filterButtons.forEach((botao) => {
        botao.addEventListener("click", () => {
            filterButtons.forEach(item => item.classList.remove("active"));
            botao.classList.add("active");

            filtroAtual = botao.dataset.filter;
            renderizarNotificacoes();
        });
    });

    if (marcarTodasBtn) {
        marcarTodasBtn.addEventListener("click", marcarTodasComoLidas);
    }

    carregarNotificacoes();

    setInterval(carregarNotificacoes, 5000);
});