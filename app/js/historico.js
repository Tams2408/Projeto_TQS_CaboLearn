document.addEventListener("DOMContentLoaded", () => {
    const historyRows = document.getElementById("history-rows");
    const performanceList = document.getElementById("performance-list");
    const recentFeedback = document.getElementById("recent-feedback");

    const statAtividades = document.getElementById("stat-atividades");
    const statSubmissoes = document.getElementById("stat-submissoes");
    const statCorrigidos = document.getElementById("stat-corrigidos");
    const statMedia = document.getElementById("stat-media");

    const filterButtons = document.querySelectorAll(".filter-btn");

    let historico = [];
    let filtroAtual = "todos";

    function escaparHTML(valor) {
        if (valor === null || valor === undefined) return "";

        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function iconeAtividade(tipo) {
        if (tipo === "submissao") return "/assets/icons/sidebar/Upload.png";
        if (tipo === "feedback") return "/assets/icons/sidebar/Document.png";
        if (tipo === "tarefa") return "/assets/icons/sidebar/Books.png";
        if (tipo === "material") return "/assets/icons/sidebar/Books.png";

        return "/assets/icons/sidebar/Time.png";
    }

    function filtrarHistorico() {
        if (filtroAtual === "todos") {
            return historico;
        }

        return historico.filter(item => item.tipo === filtroAtual);
    }

    function renderizarStats(stats) {
        if (!stats) return;

        if (statAtividades) statAtividades.textContent = stats.atividades || 0;
        if (statSubmissoes) statSubmissoes.textContent = stats.submissoes || 0;
        if (statCorrigidos) statCorrigidos.textContent = stats.corrigidos || 0;
        if (statMedia) statMedia.textContent = stats.media || 0;
    }

    function renderizarHistorico() {
        if (!historyRows) return;

        const resultado = filtrarHistorico();

        if (resultado.length === 0) {
            historyRows.innerHTML = `
                <div class="history-row">
                    <div style="grid-column: 1 / -1; text-align: center;">
                        Nenhum registo encontrado.
                    </div>
                </div>
            `;
            return;
        }

        historyRows.innerHTML = resultado.map((item) => {
            return `
                <div class="history-row">
                    <div class="activity-cell">
                        <div class="activity-icon ${escaparHTML(item.icone || "note")}">
                            <img src="${iconeAtividade(item.tipo)}" alt="">
                        </div>

                        <div class="activity-text">
                            <strong>${escaparHTML(item.titulo)}</strong>
                            <span>${escaparHTML(item.descricao)}</span>
                        </div>
                    </div>

                    <div class="subject-cell">
                        <strong>${escaparHTML(item.disciplina)}</strong>
                        <span>${escaparHTML(item.professor)}</span>
                    </div>

                    <div class="date-cell">
                        <strong>${escaparHTML(item.data)}</strong>
                        <span>Registo</span>
                    </div>

                    <div class="result-cell ${escaparHTML(item.resultado_classe)}">
                        ${escaparHTML(item.resultado)}
                    </div>

                    <div>
                        <span class="status ${escaparHTML(item.estado_classe)}">
                            ${escaparHTML(item.estado)}
                        </span>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderizarDesempenho(desempenho) {
        if (!performanceList) return;

        if (!desempenho || desempenho.length === 0) {
            performanceList.innerHTML = `
                <div class="empty-history">
                    Sem dados de desempenho.
                </div>
            `;
            return;
        }

        performanceList.innerHTML = desempenho.map((item) => {
            return `
                <div class="performance-row">
                    <div class="performance-top">
                        <span>${escaparHTML(item.disciplina)}</span>
                        <strong>${escaparHTML(item.percentagem)}%</strong>
                    </div>

                    <div class="performance-track">
                        <div 
                            class="performance-fill math" 
                            style="width: ${Number(item.percentagem || 0)}%;"
                        ></div>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderizarFeedback(feedback) {
        if (!recentFeedback) return;

        if (!feedback) {
            recentFeedback.innerHTML = `
                <strong>Sem feedback recente</strong>
                <p>Ainda não existe feedback registado.</p>
            `;
            return;
        }

        recentFeedback.innerHTML = `
            <strong>${escaparHTML(feedback.tarefa)}</strong>
            <p>${escaparHTML(feedback.feedback)}</p>

            <div class="feedback-meta">
                <span>${escaparHTML(feedback.professor)}</span>
                <strong>${escaparHTML(feedback.nota)}</strong>
            </div>
        `;
    }

    async function carregarHistorico() {
        try {
            const resposta = await fetch("/api/historico", {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!resposta.ok) {
                console.error("Erro ao carregar histórico:", resposta.status);
                return;
            }

            const dados = await resposta.json();

            historico = dados.atividades || [];

            renderizarStats(dados.stats);
            renderizarHistorico();
            renderizarDesempenho(dados.desempenho);
            renderizarFeedback(dados.feedback_recente);

        } catch (erro) {
            console.error("Erro de ligação ao carregar histórico:", erro);

            if (historyRows) {
                historyRows.innerHTML = `
                    <div class="history-row">
                        <div style="grid-column: 1 / -1; text-align: center;">
                            Erro ao carregar histórico.
                        </div>
                    </div>
                `;
            }
        }
    }

    filterButtons.forEach((botao) => {
        botao.addEventListener("click", () => {
            filterButtons.forEach(item => item.classList.remove("active"));
            botao.classList.add("active");

            filtroAtual = botao.dataset.filter || "todos";
            renderizarHistorico();
        });
    });

    carregarHistorico();

    setInterval(carregarHistorico, 10000);
});