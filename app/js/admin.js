document.addEventListener("DOMContentLoaded", () => {
    const tipoSelect = document.getElementById("tipo");
    const studentFields = document.querySelector(".student-fields");
    const professorOnly = document.querySelector(".professor-only");

    function atualizarCampos() {
        const tipo = tipoSelect.value;

        if (tipo === "estudante") {
            studentFields.style.display = "block";
        } else {
            studentFields.style.display = "none";
        }

        if (tipo === "professor") {
            professorOnly.style.display = "block";
        } else {
            professorOnly.style.display = "none";
        }
    }

    if (tipoSelect) {
        tipoSelect.addEventListener("change", atualizarCampos);
        atualizarCampos();
    }
});