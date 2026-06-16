function ajustarPagina() {
    const stage = document.querySelector(".app-stage");
    const page = document.querySelector(".inicio-page");

    const designWidth = 1920;
    const designHeight = 1080;

    const scaleX = window.innerWidth / designWidth;
    const scaleY = window.innerHeight / designHeight;

    const scale = Math.min(scaleX, scaleY);

    page.style.transform = `scale(${scale})`;
    page.style.transformOrigin = "top left";

    stage.style.width = `${designWidth * scale}px`;
    stage.style.height = `${designHeight * scale}px`;
}

window.addEventListener("load", ajustarPagina);
window.addEventListener("resize", ajustarPagina);