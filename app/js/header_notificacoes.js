document.addEventListener("DOMContentLoaded", () => {
    const badge = document.getElementById("header-notification-badge");

    async function atualizarBadgeHeader() {
        if (!badge) return;

        try {
            const resposta = await fetch("/api/notificacoes/resumo", {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!resposta.ok) {
                return;
            }

            const resumo = await resposta.json();
            const naoLidas = Number(resumo.nao_lidas || 0);

            if (naoLidas > 0) {
                badge.textContent = naoLidas > 99 ? "99+" : naoLidas;
                badge.classList.remove("hidden");
            } else {
                badge.textContent = "0";
                badge.classList.add("hidden");
            }

        } catch (erro) {
            console.error("Erro ao atualizar badge de notificações:", erro);
        }
    }

    atualizarBadgeHeader();

    setInterval(atualizarBadgeHeader, 5000);
});