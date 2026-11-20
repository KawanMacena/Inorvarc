"use strict";

const paginaAcesso = new URL("../acesso/index.html", window.location.href).href;

async function protegerPagina() {
    if (banco === null) {
        window.location.replace(paginaAcesso);
        return;
    }

    const { data } = await banco.auth.getSession();
    const logado = data.session !== null;

    if (!logado || !(await ehAdministrador())) {
        await banco.auth.signOut();
        window.location.replace(paginaAcesso);
        return;
    }

    document.body.classList.remove("aguardando-acesso");
}

document.querySelectorAll("[data-sair]").forEach((link) => {
    link.addEventListener("click", async (evento) => {
        evento.preventDefault();
        await banco.auth.signOut();
        window.location.replace(paginaAcesso);
    });
});

protegerPagina();
