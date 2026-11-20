"use strict";

// Se a chave secreta for colada aqui por engano, qualquer visitante conseguiria ler o banco inteiro.
function chaveEhSecreta(chave) {
    if (chave.startsWith("sb_secret_")) {
        return true;
    }

    // Chaves antigas são um JWT, e o papel fica na parte do meio.
    try {
        const meio = chave.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(meio)).role === "service_role";
    } catch (erro) {
        return false;
    }
}

const configurado = !SUPABASE_URL.includes("SEU-PROJETO") && !SUPABASE_CHAVE.startsWith("SUA-");

// Vale null enquanto o Supabase não estiver configurado. As telas conferem isso antes de usar.
let banco = null;

if (!configurado) {
    console.warn("Supabase não configurado. Preencha assets/js/supabase-config.js.");
} else if (chaveEhSecreta(SUPABASE_CHAVE)) {
    console.error("A chave em supabase-config.js é secreta. Troque pela chave publicável.");
} else {
    banco = supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE, {
        auth: { flowType: "pkce" }
    });
}

async function ehAdministrador() {
    const { data, error } = await banco.rpc("eh_administrador");
    return !error && data === true;
}
