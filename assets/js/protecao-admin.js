"use strict";

const paginaAcesso = new URL("../acesso/index.html", window.location.href).href;

async function protegerPagina() {
    if (banco === null) {
        window.location.replace(paginaAcesso);
        return false;
    }

    const { data } = await banco.auth.getSession();
    const logado = data.session !== null;

    if (!logado || !(await ehAdministrador())) {
        await banco.auth.signOut();
        window.location.replace(paginaAcesso);
        return false;
    }

    document.body.classList.remove("aguardando-acesso");
    return true;
}

document.querySelectorAll("[data-sair]").forEach((link) => {
    link.addEventListener("click", async (evento) => {
        evento.preventDefault();
        await banco.auth.signOut();
        window.location.replace(paginaAcesso);
    });
});
