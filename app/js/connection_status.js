document.addEventListener("DOMContentLoaded", () => {
    const statusBox = document.getElementById("connection-status");
    const statusText = document.getElementById("connection-status-text");

    function atualizarEstadoConexao() {
        if (!statusBox || !statusText) return;

        statusBox.classList.remove("online", "offline", "syncing");

        if (navigator.onLine) {
            statusBox.classList.add("online");
            statusText.textContent = "Online";
        } else {
            statusBox.classList.add("offline");
            statusText.textContent = "Sem ligação";
        }
    }

    window.addEventListener("online", () => {
        atualizarEstadoConexao();

        statusBox.classList.remove("online", "offline");
        statusBox.classList.add("syncing");
        statusText.textContent = "A sincronizar...";

        setTimeout(() => {
            atualizarEstadoConexao();
        }, 3000);
    });

    window.addEventListener("offline", atualizarEstadoConexao);

    atualizarEstadoConexao();
});