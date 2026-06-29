document.addEventListener("DOMContentLoaded", () => {
    const disciplinaSelect = document.getElementById("disciplina");
    const tarefaSelect = document.getElementById("tarefa");
    const fileInput = document.getElementById("file-upload");

    const prazoTarefa = document.getElementById("prazo-tarefa");
    const infoTarefa = document.getElementById("info-tarefa");

    const dropzone = document.getElementById("dropzone");
    const dropzoneDefault = document.getElementById("dropzone-default");
    const dropzoneFormatos = document.getElementById("dropzone-formatos");
    const dropzoneTamanho = document.getElementById("dropzone-tamanho");

    const selectedFileBox = document.getElementById("selected-file-box");
    const selectedFileIcon = document.getElementById("selected-file-icon");
    const selectedFileName = document.getElementById("selected-file-name");
    const selectedFileMeta = document.getElementById("selected-file-meta");
    const removeFileBtn = document.getElementById("remove-file-btn");

    const resumoDisciplina = document.getElementById("resumo-disciplina");
    const resumoTarefa = document.getElementById("resumo-tarefa");
    const resumoPrazo = document.getElementById("resumo-prazo");
    const resumoFicheiro = document.getElementById("resumo-ficheiro");
    const resumoStatus = document.getElementById("resumo-status");

    const observacao = document.getElementById("observacao");
    const contadorObservacao = document.querySelector(".textarea-box small");

    let tarefasCarregadas = [];
    let tarefaSelecionada = null;

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
            return "";
        }

        return nomeFicheiro.split(".").pop().toLowerCase();
    }

    function formatarTamanho(bytes) {
        if (!bytes && bytes !== 0) return "—";

        const mb = bytes / (1024 * 1024);

        if (mb >= 1) {
            return `${mb.toFixed(2)} MB`;
        }

        const kb = bytes / 1024;
        return `${kb.toFixed(1)} KB`;
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

    function calcularStatusPrazo(tarefa) {
        if (!tarefa || !tarefa.prazo) {
            return "Selecione uma tarefa";
        }

        const prazo = obterDataPrazo(tarefa.prazo);

        if (!prazo) {
            return "Prazo definido";
        }

        const agora = new Date();

        if (agora > prazo) {
            return "Prazo expirado";
        }

        return "Dentro do prazo";
    }

    function atualizarResumo() {
        const disciplina = disciplinaSelect.value || "—";

        if (resumoDisciplina) {
            resumoDisciplina.textContent = disciplina;
        }

        if (resumoTarefa) {
            resumoTarefa.textContent = tarefaSelecionada ? tarefaSelecionada.titulo : "—";
        }

        if (resumoPrazo) {
            resumoPrazo.textContent = tarefaSelecionada ? formatarPrazo(tarefaSelecionada.prazo) : "—";
        }

        if (resumoStatus) {
            resumoStatus.textContent = calcularStatusPrazo(tarefaSelecionada);

            resumoStatus.classList.remove("status-ok", "status-warning", "status-empty");

            if (!tarefaSelecionada) {
                resumoStatus.classList.add("status-empty");
            } else if (calcularStatusPrazo(tarefaSelecionada) === "Prazo expirado") {
                resumoStatus.classList.add("status-warning");
            } else {
                resumoStatus.classList.add("status-ok");
            }
        }

        if (resumoFicheiro && fileInput.files.length > 0) {
            resumoFicheiro.textContent = fileInput.files[0].name;
        } else if (resumoFicheiro) {
            resumoFicheiro.textContent = "—";
        }
    }

    function atualizarInfoTarefa() {
        if (!tarefaSelecionada) {
            prazoTarefa.textContent = "--/--/---- às --:--";
            infoTarefa.textContent = "Será preenchido automaticamente";

            if (dropzoneFormatos) {
                dropzoneFormatos.textContent = "PDF, DOCX, PPTX, ZIP, JPG, PNG";
            }

            if (dropzoneTamanho) {
                dropzoneTamanho.textContent = "Tamanho máximo: 20 MB";
            }

            fileInput.removeAttribute("accept");
            atualizarResumo();
            return;
        }

        const prazoFormatado = formatarPrazo(tarefaSelecionada.prazo);

        prazoTarefa.textContent = prazoFormatado;

        const tiposAceitos = tarefaSelecionada.tipos_aceitos || [];
        const tamanhoMaximo = tarefaSelecionada.tamanho_maximo_mb || 0;

        infoTarefa.textContent = `Formatos aceitos: ${tiposAceitos.join(", ")} | Tamanho máximo: ${tamanhoMaximo} MB`;

        if (dropzoneFormatos) {
            dropzoneFormatos.textContent = formatarExtensaoParaTexto(tiposAceitos);
        }

        if (dropzoneTamanho) {
            dropzoneTamanho.textContent = `Tamanho máximo: ${tamanhoMaximo} MB`;
        }

        if (tiposAceitos.length > 0) {
            fileInput.setAttribute("accept", tiposAceitos.join(","));
        } else {
            fileInput.removeAttribute("accept");
        }

        atualizarResumo();
    }

    function mostrarFicheiroSelecionado(ficheiro) {
        if (!ficheiro) {
            limparFicheiroSelecionado();
            return;
        }

        const extensao = obterExtensao(ficheiro.name).toUpperCase() || "FILE";

        if (selectedFileIcon) {
            selectedFileIcon.textContent = extensao;
            selectedFileIcon.className = "selected-file-icon";
            selectedFileIcon.classList.add(`file-${extensao.toLowerCase()}`);
        }

        if (selectedFileName) {
            selectedFileName.textContent = ficheiro.name;
        }

        if (selectedFileMeta) {
            selectedFileMeta.textContent = `${extensao} • ${formatarTamanho(ficheiro.size)}`;
        }

        if (dropzoneDefault) {
            dropzoneDefault.classList.add("hidden");
        }

        if (selectedFileBox) {
            selectedFileBox.classList.remove("hidden");
        }

        if (dropzone) {
            dropzone.classList.add("has-file");
        }

        atualizarResumo();
    }

    function formatarExtensaoParaTexto(extensao){
        if (!extensao || extensoes.length === 0){
            return "Formatos não definidos";
        }
        return extensoes
            .map(extensao => String(extensao).replace(".", "").toUpperCase())
    }

    function limparFicheiroSelecionado() {
        fileInput.value = "";

        if (dropzoneDefault) {
            dropzoneDefault.classList.remove("hidden");
        }

        if (selectedFileBox) {
            selectedFileBox.classList.add("hidden");
        }

        if (dropzone) {
            dropzone.classList.remove("has-file");
        }

        if (resumoFicheiro) {
            resumoFicheiro.textContent = "—";
        }

        atualizarResumo();
    }

    async function carregarTarefasPorDisciplina() {
        const disciplina = disciplinaSelect.value;

        tarefaSelecionada = null;
        tarefasCarregadas = [];

        tarefaSelect.innerHTML = `<option value="">Carregando tarefas...</option>`;
        tarefaSelect.disabled = true;

        limparFicheiroSelecionado();
        atualizarInfoTarefa();

        if (!disciplina) {
            tarefaSelect.innerHTML = `<option value="">Selecione primeiro uma disciplina</option>`;
            atualizarResumo();
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
                atualizarResumo();
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

            atualizarResumo();

        } catch (erro) {
            console.error("Erro ao buscar tarefas:", erro);

            tarefaSelect.innerHTML = `<option value="">Erro de ligação com o servidor</option>`;
        }
    }

    function selecionarTarefa() {
        const tarefaId = tarefaSelect.value;

        tarefaSelecionada = tarefasCarregadas.find(
            tarefa => String(tarefa.id) === String(tarefaId)
        ) || null;

        limparFicheiroSelecionado();
        atualizarInfoTarefa();
    }

    function atualizarContadorObservacao() {
        if (!observacao || !contadorObservacao) return;

        contadorObservacao.textContent = `${observacao.value.length}/500`;
    }

    disciplinaSelect.addEventListener("change", carregarTarefasPorDisciplina);
    tarefaSelect.addEventListener("change", selecionarTarefa);

    fileInput.addEventListener("change", () => {
        const ficheiro = fileInput.files[0];

        mostrarFicheiroSelecionado(ficheiro);
    });

    if (removeFileBtn) {
        removeFileBtn.addEventListener("click", (evento) => {
            evento.preventDefault();
            evento.stopPropagation();

            limparFicheiroSelecionado();
        });
    }

    if (observacao) {
        observacao.addEventListener("input", atualizarContadorObservacao);
        atualizarContadorObservacao();
    }

    atualizarResumo();
});