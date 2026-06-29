document.addEventListener("DOMContentLoaded", () => {
    const submissoesContainer = document.getElementById("submissoes-container");
    const detalhesSubmissao = document.getElementById("detalhes-submissao");
    const searchInput = document.getElementById("search-submissoes");
    const submissoesCount = document.getElementById("submissoes-count");

    let todasSubmissoes = [];
    let submissaoSelecionadaId = null;

    function escaparHTML(valor) {
        if (valor === null || valor === undefined) return "";

        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function obterExtensao(nomeFicheiro) {
        if (!nomeFicheiro || !nomeFicheiro.includes(".")) {
            return "file";
        }

        return nomeFicheiro.split(".").pop().toLowerCase();
    }

    function caminhoIconeFicheiro(nomeFicheiro) {
        const ext = obterExtensao(nomeFicheiro);

        if (ext === "pdf") return "/assets/icons/files/pdf.png";
        if (ext === "doc" || ext === "docx") return "/assets/icons/files/docx.png";
        if (ext === "ppt" || ext === "pptx") return "/assets/icons/files/pptx.png";
        if (ext === "zip" || ext === "rar") return "/assets/icons/files/zip.png";

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
            return "/assets/icons/files/image.png";
        }

        return "/assets/icons/files/file.png";
    }

    function classeFicheiro(nomeFicheiro) {
        const ext = obterExtensao(nomeFicheiro);

        if (ext === "pdf") return "pdf";
        if (ext === "doc" || ext === "docx") return "word";
        if (ext === "ppt" || ext === "pptx") return "ppt";
        if (ext === "zip" || ext === "rar") return "zip";
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";

        return "file";
    }

    function classeEstado(estado) {
        const valor = String(estado || "").toLowerCase();

        if (valor.includes("rejeitado")) return "rejeitado";
        if (valor.includes("reenviar")) return "reenviar";
        if (valor.includes("corrigido")) return "corrigido";
        if (valor.includes("feedback")) return "feedback";
        if (valor.includes("análise") || valor.includes("analise")) return "analise";
        if (valor.includes("entregue")) return "entregue";

        return "entregue";
    }

    function formatarDataTexto(valor) {
        if (!valor) return "—";

        const texto = String(valor);

        if (texto.includes("T")) {
            const partes = texto.split("T");
            const data = partes[0].split("-");
            const hora = partes[1] ? partes[1].slice(0, 5) : "";

            if (data.length === 3) {
                return `${data[2]}/${data[1]}/${data[0]} ${hora}`;
            }
        }

        return texto;
    }

    function filtrarSubmissoes() {
        const termo = searchInput ? searchInput.value.toLowerCase().trim() : "";

        if (!termo) {
            return todasSubmissoes;
        }

        return todasSubmissoes.filter((submissao) => {
            return (
                String(submissao.ficheiro_original || "").toLowerCase().includes(termo) ||
                String(submissao.disciplina || "").toLowerCase().includes(termo) ||
                String(submissao.tarefa_titulo || "").toLowerCase().includes(termo) ||
                String(submissao.professor_nome || "").toLowerCase().includes(termo) ||
                String(submissao.estado || "").toLowerCase().includes(termo)
            );
        });
    }

    function renderizarSubmissoes() {
        const submissoes = filtrarSubmissoes();

        if (!submissoesContainer) return;

        if (submissoesCount) {
            submissoesCount.textContent = `${submissoes.length} submissão(ões)`;
        }

        if (submissoes.length === 0) {
            submissoesContainer.innerHTML = `
                <div class="table-row">
                    <div style="grid-column: 1 / -1; text-align: center;">
                        Nenhuma submissão encontrada.
                    </div>
                </div>
            `;

            renderizarDetalhes(null);
            return;
        }

        if (!submissaoSelecionadaId) {
            submissaoSelecionadaId = submissoes[0].id;
        }

        submissoesContainer.innerHTML = submissoes.map((submissao) => {
            const selecionada = String(submissao.id) === String(submissaoSelecionadaId);
            const ext = obterExtensao(submissao.ficheiro_original).toUpperCase();
            const fileClass = classeFicheiro(submissao.ficheiro_original);
            const fileIcon = caminhoIconeFicheiro(submissao.ficheiro_original);
            const estadoClass = classeEstado(submissao.estado);

            return `
                <div class="table-row ${selecionada ? "selected" : ""}" data-id="${escaparHTML(submissao.id)}">
                    <div class="file-cell">
                        <div class="file-icon ${fileClass}">
                            <img 
                                src="${fileIcon}" 
                                alt="${escaparHTML(ext)}"
                                onerror="this.src='/assets/icons/files/file.png'"
                            >
                        </div>

                        <div class="file-info">
                            <strong>${escaparHTML(submissao.ficheiro_original)}</strong>
                            <span>${escaparHTML(ext)} - ${escaparHTML(submissao.tamanho_mb)} MB</span>
                        </div>
                    </div>

                    <div class="subject-cell">
                        <strong>${escaparHTML(submissao.disciplina)}</strong>
                        <span>${escaparHTML(submissao.professor_nome)}</span>
                    </div>

                    <div class="date-cell">
                        <strong>${escaparHTML(submissao.data_envio || "—")}</strong>
                        <span>Enviado</span>
                    </div>

                    <div class="date-cell">
                        <strong>${escaparHTML(formatarDataTexto(submissao.prazo))}</strong>
                        <span>Prazo</span>
                    </div>

                    <div>
                        <span class="status ${estadoClass}">
                            ${escaparHTML(submissao.estado || "Entregue")}
                        </span>
                    </div>

                    <div class="${submissao.feedback ? "feedback-cell" : "feedback-muted"}">
                        ${
                            submissao.feedback
                                ? `<a href="#" class="ver-feedback-link">Ver feedback</a><span>→</span>`
                                : `Sem feedback`
                        }
                    </div>
                </div>
            `;
        }).join("");

        document.querySelectorAll("#submissoes-container .table-row").forEach((linha) => {
            linha.addEventListener("click", () => {
                submissaoSelecionadaId = linha.dataset.id;

                renderizarSubmissoes();

                const submissao = todasSubmissoes.find(
                    item => String(item.id) === String(submissaoSelecionadaId)
                );

                renderizarDetalhes(submissao);
            });
        });

        const submissaoSelecionada = submissoes.find(
            item => String(item.id) === String(submissaoSelecionadaId)
        );

        renderizarDetalhes(submissaoSelecionada || submissoes[0]);
    }

    function renderizarDetalhes(submissao) {
        if (!detalhesSubmissao) return;

        if (!submissao) {
            detalhesSubmissao.innerHTML = `
                <div class="details-title">
                    <div class="details-icon">▤</div>
                    <h2>Detalhes da submissão</h2>
                </div>

                <div class="empty-details">
                    Nenhuma submissão selecionada.
                </div>
            `;
            return;
        }

        const ext = obterExtensao(submissao.ficheiro_original).toUpperCase();
        const fileClass = classeFicheiro(submissao.ficheiro_original);
        const fileIcon = caminhoIconeFicheiro(submissao.ficheiro_original);
        const estadoClass = classeEstado(submissao.estado);

        detalhesSubmissao.innerHTML = `
            <div class="details-title">
                <div class="details-icon">▤</div>
                <h2>Detalhes da submissão</h2>
            </div>

            <div class="selected-file-box">
                <div class="file-icon ${fileClass}">
                    <img 
                        src="${fileIcon}" 
                        alt="${escaparHTML(ext)}"
                        onerror="this.src='/assets/icons/files/file.png'"
                    >
                </div>

                <div>
                    <strong>${escaparHTML(submissao.ficheiro_original)}</strong>
                    <span>${escaparHTML(ext)} - ${escaparHTML(submissao.tamanho_mb)} MB</span>
                </div>
            </div>

            <div class="details-list">
                <div class="details-row">
                    <span>Tarefa</span>
                    <strong>${escaparHTML(submissao.tarefa_titulo)}</strong>
                </div>

                <div class="details-row">
                    <span>Disciplina</span>
                    <strong>${escaparHTML(submissao.disciplina)}</strong>
                </div>

                <div class="details-row">
                    <span>Professor</span>
                    <strong>${escaparHTML(submissao.professor_nome)}</strong>
                </div>

                <div class="details-row">
                    <span>Data de envio</span>
                    <strong>${escaparHTML(submissao.data_envio || "—")}</strong>
                </div>

                <div class="details-row">
                    <span>Prazo</span>
                    <strong>${escaparHTML(formatarDataTexto(submissao.prazo))}</strong>
                </div>

                <div class="details-row">
                    <span>Estado</span>
                    <strong>
                        <span class="status ${estadoClass}">
                            ${escaparHTML(submissao.estado || "Entregue")}
                        </span>
                    </strong>
                </div>

                <div class="details-row">
                    <span>Nota</span>
                    <strong class="grade">
                        ${submissao.nota !== null && submissao.nota !== undefined ? escaparHTML(submissao.nota) : "—"}
                    </strong>
                </div>
            </div>

            <div class="feedback-section">
                <div class="feedback-title">
                    <span>●</span>
                    <h3>Feedback do professor</h3>
                </div>

                <div class="feedback-box">
                    ${
                        submissao.feedback
                            ? `<p>${escaparHTML(submissao.feedback)}</p>`
                            : `<p>Ainda não existe feedback para esta submissão.</p>`
                    }
                </div>
            </div>

            <div class="details-actions">
                <a href="/submissoes/${submissao.id}/baixar" class="btn-outline">
                    ↓ Baixar ficheiro
                </a>

                <button class="btn-primary" type="button">
                    ● Ver feedback completo
                </button>
            </div>
        `;
    }

    async function carregarSubmissoes() {
        if (!submissoesContainer) return;

        let resposta;

        try {
            resposta = await fetch("/api/submissoes", {
                headers: {
                    "Accept": "application/json"
                }
            });
        } catch (erro) {
            console.error("Não foi possível contactar /api/submissoes:", erro);

            submissoesContainer.innerHTML = `
                <div class="table-row">
                    <div style="grid-column: 1 / -1; text-align: center;">
                        Erro de ligação com o servidor.
                    </div>
                </div>
            `;
            return;
        }

        const contentType = resposta.headers.get("content-type") || "";

        if (!resposta.ok) {
            const textoErro = await resposta.text();
            console.error("Erro HTTP em /api/submissoes:", resposta.status, textoErro);

            submissoesContainer.innerHTML = `
                <div class="table-row">
                    <div style="grid-column: 1 / -1; text-align: center;">
                        Erro ao carregar submissões. Código: ${resposta.status}
                    </div>
                </div>
            `;
            return;
        }

        if (!contentType.includes("application/json")) {
            const textoRecebido = await resposta.text();
            console.error("A API não devolveu JSON. Recebeu isto:", textoRecebido);

            submissoesContainer.innerHTML = `
                <div class="table-row">
                    <div style="grid-column: 1 / -1; text-align: center;">
                        A API não devolveu JSON. Faça login novamente ou verifique a rota /api/submissoes.
                    </div>
                </div>
            `;
            return;
        }

        try {
            todasSubmissoes = await resposta.json();

            const existeSelecionada = todasSubmissoes.some(
                item => String(item.id) === String(submissaoSelecionadaId)
            );

            if (!existeSelecionada) {
                submissaoSelecionadaId = todasSubmissoes.length > 0 ? todasSubmissoes[0].id : null;
            }

            renderizarSubmissoes();

        } catch (erro) {
            console.error("Erro ao processar/renderizar submissões:", erro);

            submissoesContainer.innerHTML = `
                <div class="table-row">
                    <div style="grid-column: 1 / -1; text-align: center;">
                        Erro ao montar as submissões. Veja o console do navegador.
                    </div>
                </div>
            `;
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderizarSubmissoes();
        });
    }

    carregarSubmissoes();
    setInterval(carregarSubmissoes, 5000);
});