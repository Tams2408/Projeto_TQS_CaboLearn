document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("avatar-form");
    const cameraBtn = document.getElementById("avatar-camera-btn");
    const input = document.getElementById("avatar-input");
    const preview = document.getElementById("avatar-preview");

    if (!form || !cameraBtn || !input || !preview) return;

    cameraBtn.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", () => {
        const ficheiro = input.files[0];

        if (!ficheiro) return;

        const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];

        if (!tiposPermitidos.includes(ficheiro.type)) {
            alert("Formato inválido. Use PNG, JPG, JPEG ou WEBP.");
            input.value = "";
            return;
        }

        const tamanhoMb = ficheiro.size / (1024 * 1024);

        if (tamanhoMb > 2) {
            alert("A imagem deve ter no máximo 2 MB.");
            input.value = "";
            return;
        }

        preview.src = URL.createObjectURL(ficheiro);

        form.submit();
    });
});