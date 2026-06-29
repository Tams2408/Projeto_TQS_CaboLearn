document.addEventListener("DOMContentLoaded", () => {
    const disciplinaSelect = document.getElementById("disciplina");
    const tarefaSelect = document.getElementById("tarefa");
    const fileInput = document.getElementById("file-upload");
<<<<<<< HEAD
    const submissaoExistenteInput = document.getElementById("submissao-existente");
=======
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

    const prazoTarefa = document.getElementById("prazo-tarefa");
    const infoTarefa = document.getElementById("info-tarefa");

    const dropzone = document.getElementById("dropzone");
    const dropzoneDefault = document.getElementById("dropzone-default");
<<<<<<< HEAD
    const selectedFileBox = document.getElementById("selected-file-box");
=======
    const dropzoneFormatos = document.getElementById("dropzone-formatos");
    const dropzoneTamanho = document.getElementById("dropzone-tamanho");

    const selectedFileBox = document.getElementById("selected-file-box");
    const selectedFileIcon = document.getElementById("selected-file-icon");
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
    const selectedFileName = document.getElementById("selected-file-name");
    const selectedFileMeta = document.getElementById("selected-file-meta");
    const removeFileBtn = document.getElementById("remove-file-btn");

<<<<<<< HEAD
    const observacao = document.getElementById("observacao");
    const contadorObservacao = document.querySelector(".textarea-box small");

=======
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
    const resumoDisciplina = document.getElementById("resumo-disciplina");
    const resumoTarefa = document.getElementById("resumo-tarefa");
    const resumoPrazo = document.getElementById("resumo-prazo");
    const resumoFicheiro = document.getElementById("resumo-ficheiro");
    const resumoStatus = document.getElementById("resumo-status");

<<<<<<< HEAD
    const submitText = document.querySelector(".btn-submit span");

    let tarefasCarregadas = [];
    let tarefaSelecionada = null;
    let submissaoExistente = null;
    let ficheiroNovoSelecionado = false;

    function formatarTamanho(bytes) {
=======
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

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        const mb = bytes / (1024 * 1024);

        if (mb >= 1) {
            return `${mb.toFixed(2)} MB`;
        }

<<<<<<< HEAD
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    function obterExtensao(nomeFicheiro) {
        if (!nomeFicheiro || !nomeFicheiro.includes(".")) return "FILE";
        return nomeFicheiro.split(".").pop().toUpperCase();
=======
        const kb = bytes / 1024;
        return `${kb.toFixed(1)} KB`;
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
    }

    function formatarPrazo(valor) {
        if (!valor) return "Sem prazo definido";

        let data = null;
<<<<<<< HEAD
=======

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        const texto = String(valor).trim();

        if (texto.includes("T")) {
            data = new Date(texto);
        } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(texto)) {
            data = new Date(texto.replace(" ", "T"));
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
            const partes = texto.replace(";", ":").split(" ");
            const dataPartes = partes[0].split("/");
            const hora = partes[1] || "00:00";
<<<<<<< HEAD
=======

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
            data = new Date(`${dataPartes[2]}-${dataPartes[1]}-${dataPartes[0]}T${hora}`);
        }

        if (!data || Number.isNaN(data.getTime())) {
            return texto;
        }

        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();
<<<<<<< HEAD
=======

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
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

<<<<<<< HEAD
    function calcularStatusPrazo() {
        if (!tarefaSelecionada) return "Aguardando dados";

        const prazo = obterDataPrazo(tarefaSelecionada.prazo);

        if (!prazo) return "Prazo definido";

        if (new Date() > prazo) {
            return "Fora do prazo";
=======
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
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        }

        return "Dentro do prazo";
    }

    function atualizarResumo() {
<<<<<<< HEAD
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
=======
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
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

            resumoStatus.classList.remove("status-ok", "status-warning", "status-empty");

            if (!tarefaSelecionada) {
                resumoStatus.classList.add("status-empty");
<<<<<<< HEAD
            } else if (status === "Fora do prazo") {
=======
            } else if (calcularStatusPrazo(tarefaSelecionada) === "Prazo expirado") {
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
                resumoStatus.classList.add("status-warning");
            } else {
                resumoStatus.classList.add("status-ok");
            }
        }
<<<<<<< HEAD
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
=======

        if (resumoFicheiro && fileInput.files.length > 0) {
            resumoFicheiro.textContent = fileInput.files[0].name;
        } else if (resumoFicheiro) {
            resumoFicheiro.textContent = "—";
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        }
    }

    function atualizarInfoTarefa() {
        if (!tarefaSelecionada) {
            prazoTarefa.textContent = "--/--/---- às --:--";
            infoTarefa.textContent = "Será preenchido automaticamente";
<<<<<<< HEAD
=======

            if (dropzoneFormatos) {
                dropzoneFormatos.textContent = "PDF, DOCX, PPTX, ZIP, JPG, PNG";
            }

            if (dropzoneTamanho) {
                dropzoneTamanho.textContent = "Tamanho máximo: 20 MB";
            }

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
            fileInput.removeAttribute("accept");
            atualizarResumo();
            return;
        }

<<<<<<< HEAD
        prazoTarefa.textContent = formatarPrazo(tarefaSelecionada.prazo);
=======
        const prazoFormatado = formatarPrazo(tarefaSelecionada.prazo);

        prazoTarefa.textContent = prazoFormatado;
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e

        const tiposAceitos = tarefaSelecionada.tipos_aceitos || [];
        const tamanhoMaximo = tarefaSelecionada.tamanho_maximo_mb || 0;

        infoTarefa.textContent = `Formatos aceitos: ${tiposAceitos.join(", ")} | Tamanho máximo: ${tamanhoMaximo} MB`;

<<<<<<< HEAD
=======
        if (dropzoneFormatos) {
            dropzoneFormatos.textContent = formatarExtensaoParaTexto(tiposAceitos);
        }

        if (dropzoneTamanho) {
            dropzoneTamanho.textContent = `Tamanho máximo: ${tamanhoMaximo} MB`;
        }

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        if (tiposAceitos.length > 0) {
            fileInput.setAttribute("accept", tiposAceitos.join(","));
        } else {
            fileInput.removeAttribute("accept");
        }

        atualizarResumo();
    }

<<<<<<< HEAD
=======
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

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
    async function carregarTarefasPorDisciplina() {
        const disciplina = disciplinaSelect.value;

        tarefaSelecionada = null;
        tarefasCarregadas = [];

        tarefaSelect.innerHTML = `<option value="">Carregando tarefas...</option>`;
        tarefaSelect.disabled = true;

<<<<<<< HEAD
        resetarSubmissaoExistente();
=======
        limparFicheiroSelecionado();
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        atualizarInfoTarefa();

        if (!disciplina) {
            tarefaSelect.innerHTML = `<option value="">Selecione primeiro uma disciplina</option>`;
<<<<<<< HEAD
=======
            atualizarResumo();
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
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
<<<<<<< HEAD
=======
                atualizarResumo();
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
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

<<<<<<< HEAD
        } catch (erro) {
            console.error("Erro ao buscar tarefas:", erro);
=======
            atualizarResumo();

        } catch (erro) {
            console.error("Erro ao buscar tarefas:", erro);

>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
            tarefaSelect.innerHTML = `<option value="">Erro de ligação com o servidor</option>`;
        }
    }

<<<<<<< HEAD
    async function selecionarTarefa() {
=======
    function selecionarTarefa() {
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        const tarefaId = tarefaSelect.value;

        tarefaSelecionada = tarefasCarregadas.find(
            tarefa => String(tarefa.id) === String(tarefaId)
        ) || null;

<<<<<<< HEAD
        fileInput.value = "";
        ficheiroNovoSelecionado = false;

        atualizarInfoTarefa();

        if (tarefaSelecionada) {
            await carregarSubmissaoExistente(tarefaSelecionada.id);
        } else {
            resetarSubmissaoExistente();
        }
=======
        limparFicheiroSelecionado();
        atualizarInfoTarefa();
    }

    function atualizarContadorObservacao() {
        if (!observacao || !contadorObservacao) return;

        contadorObservacao.textContent = `${observacao.value.length}/500`;
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
    }

    disciplinaSelect.addEventListener("change", carregarTarefasPorDisciplina);
    tarefaSelect.addEventListener("change", selecionarTarefa);

    fileInput.addEventListener("change", () => {
<<<<<<< HEAD
        mostrarFicheiroNovo(fileInput.files[0]);
=======
        const ficheiro = fileInput.files[0];

        mostrarFicheiroSelecionado(ficheiro);
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
    });

    if (removeFileBtn) {
        removeFileBtn.addEventListener("click", (evento) => {
            evento.preventDefault();
            evento.stopPropagation();

<<<<<<< HEAD
            if (submissaoExistente && !ficheiroNovoSelecionado) {
                fileInput.click();
                return;
            }

            limparFicheiroNovo();
=======
            limparFicheiroSelecionado();
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        });
    }

    if (observacao) {
<<<<<<< HEAD
        observacao.addEventListener("input", () => {
            atualizarContadorObservacao();
            atualizarResumo();
        });

=======
        observacao.addEventListener("input", atualizarContadorObservacao);
>>>>>>> 622dc1411a2c3a7ba36672e96d76121f72c0fa0e
        atualizarContadorObservacao();
    }

    atualizarResumo();
});