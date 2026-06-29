document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("password-modal");
    const abrirBtn = document.getElementById("abrir-password-modal");
    const fecharBtn = document.getElementById("fechar-password-modal");
    const cancelarBtn = document.getElementById("cancelar-password-modal");

    function abrirModal() {
        if (modal) {
            modal.classList.add("show");
        }
    }

    function fecharModal() {
        if (modal) {
            modal.classList.remove("show");
        }
    }

    if (abrirBtn) {
        abrirBtn.addEventListener("click", abrirModal);
    }

    if (fecharBtn) {
        fecharBtn.addEventListener("click", fecharModal);
    }

    if (cancelarBtn) {
        cancelarBtn.addEventListener("click", fecharModal);
    }

    if (modal) {
        modal.addEventListener("click", (evento) => {
            if (evento.target === modal) {
                fecharModal();
            }
        });
    }
});