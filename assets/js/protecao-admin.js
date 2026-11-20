"use strict";

// Esconder a página é só para a interface. Quem impede o acesso aos dados é o RLS do banco.
(async function () {
    const paginaAcesso = new URL("../acesso/index.html", window.location.href).href;
    const { supabase: cliente, ehAdministrador } = window.inovarc;

    if (!cliente) {
        window.location.replace(paginaAcesso);
        return;
    }

    const { data: { session } } = await cliente.auth.getSession();

    if (!session || !(await ehAdministrador())) {
        if (session) {
            await cliente.auth.signOut();
        }
        window.location.replace(paginaAcesso);
        return;
    }

    document.body.classList.remove("aguardando-acesso");

    document.querySelectorAll("[data-sair]").forEach((link) => {
        link.addEventListener("click", async (evento) => {
            evento.preventDefault();
            await cliente.auth.signOut();
            window.location.replace(paginaAcesso);
        });
    });

    cliente.auth.onAuthStateChange((evento) => {
        if (evento === "SIGNED_OUT") {
            window.location.replace(paginaAcesso);
        }
    });
})();
