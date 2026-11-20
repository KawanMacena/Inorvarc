"use strict";

(function () {
    const config = window.INOVARC_SUPABASE || {};
    const url = typeof config.url === "string" ? config.url : "";
    const chave = typeof config.chavePublica === "string" ? config.chavePublica : "";

    function chaveSecreta(valor) {
        if (valor.startsWith("sb_secret_")) {
            return true;
        }

        try {
            const conteudo = JSON.parse(atob(valor.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            return conteudo.role === "service_role";
        } catch {
            return false;
        }
    }

    const configurado = url.startsWith("https://") && !url.includes("SEU-PROJETO")
        && chave !== "" && !chave.startsWith("SUA-");

    if (!window.supabase || !configurado) {
        console.error("Supabase não configurado: preencha assets/js/supabase-config.js.");
        window.inovarc = Object.freeze({ supabase: null, ehAdministrador: async () => false });
        return;
    }

    if (chaveSecreta(chave)) {
        console.error("A chave em supabase-config.js é secreta. Use a chave publicável (anon) e gere uma nova chave secreta no painel do Supabase.");
        window.inovarc = Object.freeze({ supabase: null, ehAdministrador: async () => false });
        return;
    }

    const cliente = window.supabase.createClient(url, chave, {
        auth: {
            flowType: "pkce",
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });

    async function ehAdministrador() {
        const { data, error } = await cliente.rpc("is_admin");
        return !error && data === true;
    }

    window.inovarc = Object.freeze({ supabase: cliente, ehAdministrador });
})();
