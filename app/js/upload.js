document.addEventListener("DOMContentLoaded", () => {
    const disciplinaSelect = document.getElementById("disciplina");
    const tarefaSelect = document.getElementById("tarefa");
    const fileInput = document.getElementById("file-upload");
    const submissaoExistenteInput = document.getElementById("submissao-existente");

    const prazoTarefa = document.getElementById("prazo-tarefa");
    const infoTarefa = document.getElementById("info-tarefa");

    const dropzone = document.getElementById("dropzone");
    const dropzoneDefault = document.getElementById("dropzone-default");
    const selectedFileBox = document.getElementById("selected-file-box");
    const selectedFileName = document.getElementById("selected-file-name");
    const selectedFileMeta = document.getElementById("selected-file-meta");
    const removeFileBtn = document.getElementById("remove-file-btn");

    const observacao = document.getElementById("observacao");
    const contadorObservacao = document.querySelector(".textarea-box small");

    const resumoDisciplina = document.getElementById("resumo-disciplina");
    const resumoTarefa = document.getElementById("resumo-tarefa");
    const resumoPrazo = document.getElementById("resumo-prazo");
    const resumoFicheiro = document.getElementById("resumo-ficheiro");
    const resumoStatus = document.getElementById("resumo-status");

    const submitText = document.querySelector(".btn-submit span");

    let tarefasCarregadas = [];
    let tarefaSelecionada = null;
    let submissaoExistente = null;
    let ficheiroNovoSelecionado = false;

    function formatarTamanho(bytes) {
        const mb = bytes / (1024 * 1024);

        if (mb >= 1) {
            return `${mb.toFixed(2)} MB`;
        }

        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    function obterExtensao(nomeFicheiro) {
        if (!nomeFicheiro || !nomeFicheiro.includes(".")) return "FILE";
        return nomeFicheiro.split(".").pop().toUpperCase();
    }

    function formatarPrazo(valor) {
        if (!valor) return "Sem prazo definido";

        let data = null;
        const texto = String(valor).trim();

        if (texto.includes("T")) {
            data = new Date(texto);
        } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(texto)) {
            data = new Date(texto.replace(" ", "T"));
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
            const partes = texto.replace(";", ":").split(" ");
            const dataPartes = partes[0].split("/");
            const hora = partes[1] || "00:00";
            data = new Date(`${dataPartes[2]}-${dataPartes[1]}-${dataPartes[0]}T${hora}`);
        }

        if (!data || Number.isNaN(data.getTime())) {
            return texto;
        }

        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, "0");
        const minuto = String(data.getMinutes()).padStart(2, "0");

        return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;
    }

    function obterDataPrazo(valor) {
        if (!valor) return null;

        const texto = String(valor).trim();

        if (texto.includes("T")) {
            const data = new Date(texto);
            return Number.isNaN(data.getTime()) ? null : data;
        }

        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(texto)) {
            const data = new Date(texto.replace(" ", "T"));
            return Number.isNaN(data.getTime()) ? null : data;
        }

        if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
            const partes = texto.replace(";", ":").split(" ");
            const dataPartes = partes[0].split("/");
            const hora = partes[1] || "00:00";

            const data = new Date(`${dataPartes[2]}-${dataPartes[1]}-${dataPartes[0]}T${hora}`);
            return Number.isNaN(data.getTime()) ? null : data;
        }

        return null;
    }

    function calcularStatusPrazo() {
        if (!tarefaSelecionada) return "Aguardando dados";

        const prazo = obterDataPrazo(tarefaSelecionada.prazo);

        if (!prazo) return "Prazo definido";

        if (new Date() > prazo) {
            return "Fora do prazo";
        }

        return "Dentro do prazo";
    }

    function atualizarResumo() {
        if (resumoDisciplina) resumoDisciplina.textContent = disciplinaSelect.value || "—";
        if (resumoTarefa) resumoTarefa.textContent = tarefaSelecionada ? tarefaSelecionada.titulo : "—";
        if (resumoPrazo) resumoPrazo.textContent = tarefaSelecionada ? formatarPrazo(tarefaSelecionada.prazo) : "—";

        if (resumoFicheiro) {
            if (ficheiroNovoSelecionado && fileInput.files[0]) {
                resumoFicheiro.textContent = fileInput.files[0].name;
            } else if (submissaoExistente) {
                resumoFicheiro.textContent = submissaoExistente.ficheiro_original || "—";
            } else {
                resumoFicheiro.textContent = "—";
            }
        }

        if (resumoStatus) {
            const status = submissaoExistente ? "Já submetido" : calcularStatusPrazo();
            resumoStatus.textContent = status;

            resumoStatus.classList.remove("status-ok", "status-warning", "status-empty");

            if (!tarefaSelecionada) {
                resumoStatus.classList.add("status-empty");
            } else if (status === "Fora do prazo") {
                resumoStatus.classList.add("status-warning");
            } else {
                resumoStatus.classList.add("status-ok");
            }
        }
    }

    function atualizarContadorObservacao() {
        if (!observacao || !contadorObservacao) return;
        contadorObservacao.textContent = `${observacao.value.length}/500`;
    }

    function limparFicheiroNovo() {
        fileInput.value = "";
        ficheiroNovoSelecionado = false;

        if (submissaoExistente) {
            mostrarSubmissaoExistente();
            return;
        }

        if (dropzoneDefault) dropzoneDefault.classList.remove("hidden");
        if (selectedFileBox) selectedFileBox.classList.add("hidden");
        if (dropzone) dropzone.classList.remove("has-file");

        atualizarResumo();
    }

    function mostrarFicheiroNovo(ficheiro) {
        if (!ficheiro) {
            limparFicheiroNovo();
            return;
        }

        ficheiroNovoSelecionado = true;

        if (selectedFileName) selectedFileName.textContent = ficheiro.name;
        if (selectedFileMeta) selectedFileMeta.textContent = `${obterExtensao(ficheiro.name)} • ${formatarTamanho(ficheiro.size)} • novo ficheiro`;

        if (removeFileBtn) removeFileBtn.textContent = submissaoExistente ? "Cancelar troca" : "Remover";

        if (dropzoneDefault) dropzoneDefault.classList.add("hidden");
        if (selectedFileBox) selectedFileBox.classList.remove("hidden");
        if (dropzone) dropzone.classList.add("has-file");

        atualizarResumo();
    }

    function mostrarSubmissaoExistente() {
        if (!submissaoExistente) return;

        if (selectedFileName) selectedFileName.textContent = submissaoExistente.ficheiro_original || "Ficheiro submetido";
        if (selectedFileMeta) {
            selectedFileMeta.textContent = `Já submetido • ${submissaoExistente.data_envio || "sem data"} • selecione outro ficheiro para substituir`;
        }

        if (removeFileBtn) removeFileBtn.textContent = "Substituir";

        if (dropzoneDefault) dropzoneDefault.classList.add("hidden");
        if (selectedFileBox) selectedFileBox.classList.remove("hidden");
        if (dropzone) dropzone.classList.add("has-file");

        atualizarResumo();
    }

    function resetarSubmissaoExistente() {
        submissaoExistente = null;
        ficheiroNovoSelecionado = false;

        if (submissaoExistenteInput) submissaoExistenteInput.value = "0";
        if (observacao) observacao.value = "";
        if (submitText) submitText.textContent = "Submeter trabalho";

        limparFicheiroNovo();
        atualizarContadorObservacao();
        atualizarResumo();
    }

    async function carregarSubmissaoExistente(tarefaId) {
        submissaoExistente = null;

        if (submissaoExistenteInput) submissaoExistenteInput.value = "0";

        if (!tarefaId) {
            resetarSubmissaoExistente();
            return;
        }

        try {
            const resposta = await fetch(`/api/minha-submissao/${encodeURIComponent(tarefaId)}`, {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!resposta.ok) {
                resetarSubmissaoExistente();
                return;
            }

            const dados = await resposta.json();

            if (!dados.ok || !dados.existe) {
                resetarSubmissaoExistente();
                return;
            }

            submissaoExistente = dados.submissao;
            ficheiroNovoSelecionado = false;
            fileInput.value = "";

            if (submissaoExistenteInput) submissaoExistenteInput.value = "1";
            if (observacao) observacao.value = submissaoExistente.observacao || "";
            if (submitText) submitText.textContent = "Atualizar submissão";

            mostrarSubmissaoExistente();
            atualizarContadorObservacao();
            atualizarResumo();

        } catch (erro) {
            console.error("Erro ao carregar submissão existente:", erro);
            resetarSubmissaoExistente();
        }
    }

    function atualizarInfoTarefa() {
        if (!tarefaSelecionada) {
            prazoTarefa.textContent = "--/--/---- às --:--";
            infoTarefa.textContent = "Será preenchido automaticamente";
            fileInput.removeAttribute("accept");
            atualizarResumo();
            return;
        }

        prazoTarefa.textContent = formatarPrazo(tarefaSelecionada.prazo);

        const tiposAceitos = tarefaSelecionada.tipos_aceitos || [];
        const tamanhoMaximo = tarefaSelecionada.tamanho_maximo_mb || 0;

        infoTarefa.textContent = `Formatos aceitos: ${tiposAceitos.join(", ")} | Tamanho máximo: ${tamanhoMaximo} MB`;

        if (tiposAceitos.length > 0) {
            fileInput.setAttribute("accept", tiposAceitos.join(","));
        } else {
            fileInput.removeAttribute("accept");
        }

        atualizarResumo();
    }

    async function carregarTarefasPorDisciplina() {
        const disciplina = disciplinaSelect.value;

        tarefaSelecionada = null;
        tarefasCarregadas = [];

        tarefaSelect.innerHTML = `<option value="">Carregando tarefas...</option>`;
        tarefaSelect.disabled = true;

        resetarSubmissaoExistente();
        atualizarInfoTarefa();

        if (!disciplina) {
            tarefaSelect.innerHTML = `<option value="">Selecione primeiro uma disciplina</option>`;
            return;
        }

        try {
            const resposta = await fetch(`/api/tarefas?disciplina=${encodeURIComponent(disciplina)}`, {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!resposta.ok) {
                tarefaSelect.innerHTML = `<option value="">Erro ao carregar tarefas</option>`;
                return;
            }

            tarefasCarregadas = await resposta.json();

            if (tarefasCarregadas.length === 0) {
                tarefaSelect.innerHTML = `<option value="">Nenhuma tarefa disponível</option>`;
                return;
            }

            tarefaSelect.disabled = false;
            tarefaSelect.innerHTML = `<option value="">Selecione a tarefa</option>`;

            tarefasCarregadas.forEach((tarefa) => {
                const option = document.createElement("option");
                option.value = tarefa.id;
                option.textContent = tarefa.titulo;
                tarefaSelect.appendChild(option);
            });

        } catch (erro) {
            console.error("Erro ao buscar tarefas:", erro);
            tarefaSelect.innerHTML = `<option value="">Erro de ligação com o servidor</option>`;
        }
    }

    async function selecionarTarefa() {
        const tarefaId = tarefaSelect.value;

        tarefaSelecionada = tarefasCarregadas.find(
            tarefa => String(tarefa.id) === String(tarefaId)
        ) || null;

        fileInput.value = "";
        ficheiroNovoSelecionado = false;

        atualizarInfoTarefa();

        if (tarefaSelecionada) {
            await carregarSubmissaoExistente(tarefaSelecionada.id);
        } else {
            resetarSubmissaoExistente();
        }
    }

    disciplinaSelect.addEventListener("change", carregarTarefasPorDisciplina);
    tarefaSelect.addEventListener("change", selecionarTarefa);

    fileInput.addEventListener("change", () => {
        mostrarFicheiroNovo(fileInput.files[0]);
    });

    if (removeFileBtn) {
        removeFileBtn.addEventListener("click", (evento) => {
            evento.preventDefault();
            evento.stopPropagation();

            if (submissaoExistente && !ficheiroNovoSelecionado) {
                fileInput.click();
                return;
            }

            limparFicheiroNovo();
        });
    }

    if (observacao) {
        observacao.addEventListener("input", () => {
            atualizarContadorObservacao();
            atualizarResumo();
        });

        atualizarContadorObservacao();
    }

    atualizarResumo();
});