"use strict";

const escolha = document.getElementById("escolha");
const login = document.getElementById("login");
const overlay = document.getElementById("overlay");
const formularios = document.querySelectorAll(".login-form");
let tipoAcessoAtual = "cidadao";

const cliente = window.inovarc ? window.inovarc.supabase : null;
const paginaAcesso = window.location.origin + window.location.pathname;
const paginaPainel = new URL("../painel/index.html", window.location.href).href;
const CHAVE_TIPO_ACESSO = "inovarc:tipoAcesso";

document.querySelectorAll("img").forEach((imagem) => {
    imagem.addEventListener("error", () => {
        imagem.hidden = true;
    }, { once: true });
});

function mostrarFormulario(idFormulario) {
    formularios.forEach((formulario) => {
        formulario.classList.toggle("ativo", formulario.id === idFormulario);
    });
}

function abrirPainel(idFormulario) {
    escolha.classList.add("esconder");
    login.classList.add("mostrar");
    login.setAttribute("aria-hidden", "false");
    overlay.classList.add("ativo");
    mostrarFormulario(idFormulario);
}

function fecharPainel() {
    escolha.classList.remove("esconder");
    login.classList.remove("mostrar");
    login.setAttribute("aria-hidden", "true");
    overlay.classList.remove("ativo");
    mostrarFormulario("");
}

document.querySelectorAll("[data-abrir-login]").forEach((botao) => {
    botao.addEventListener("click", () => {
        tipoAcessoAtual = botao.dataset.abrirLogin;
        abrirPainel(tipoAcessoAtual === "cidadao" ? "loginCidadao" : "loginAdmin");
    });
});

document.querySelectorAll("[data-abrir-cadastro]").forEach((link) => {
    link.addEventListener("click", (evento) => {
        evento.preventDefault();
        const tipo = link.dataset.abrirCadastro;
        abrirPainel(tipo === "cidadao" ? "cadastroCidadao" : "cadastroAdmin");
    });
});

document.getElementById("voltar").addEventListener("click", () => {
    if (document.getElementById("cadastroCidadao").classList.contains("ativo")
        || document.getElementById("cadastroAdmin").classList.contains("ativo")) {
        abrirPainel(tipoAcessoAtual === "cidadao" ? "loginCidadao" : "loginAdmin");
        return;
    }

    fecharPainel();
});

overlay.addEventListener("click", fecharPainel);

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && login.classList.contains("mostrar")) {
        fecharPainel();
    }
});

/* VALIDAÇÕES */

function apenasDigitos(valor) {
    return valor.replace(/\D/g, "");
}

function senhaForte(senha) {
    return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

function cnpjValido(cnpj) {
    if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
        return false;
    }

    const digito = (pesos) => {
        const soma = pesos.reduce((total, peso, i) => total + Number(cnpj[i]) * peso, 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    return digito([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[12])
        && digito([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[13]);
}

function conferirSenhas(formulario) {
    const senha = formulario.elements.namedItem("senha").value;
    const confirmarSenha = formulario.elements.namedItem("confirmarSenha").value;

    if (!senhaForte(senha)) {
        window.alert("A senha precisa ter pelo menos 8 caracteres, com letras e números.");
        formulario.elements.namedItem("senha").focus();
        return null;
    }

    if (senha !== confirmarSenha) {
        window.alert("As senhas não coincidem.");
        formulario.elements.namedItem("confirmarSenha").focus();
        return null;
    }

    return senha;
}

/* SUPABASE */

// As mensagens não dizem se o e-mail existe, para não revelar quem tem conta.
function mensagemDeErro(erro) {
    switch (erro && erro.code) {
        case "invalid_credentials":
            return "E-mail ou senha inválidos.";
        case "email_not_confirmed":
            return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
        case "weak_password":
            return "Senha fraca. Use pelo menos 8 caracteres, com letras e números.";
        case "same_password":
            return "A nova senha precisa ser diferente da atual.";
        case "over_email_send_rate_limit":
        case "over_request_rate_limit":
            return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        default:
            return "Não foi possível concluir a operação. Tente novamente.";
    }
}

function sistemaDisponivel() {
    if (cliente) {
        return true;
    }

    window.alert("O sistema ainda não está conectado ao banco de dados.");
    return false;
}

async function comBotaoOcupado(formulario, acao) {
    const botoes = formulario.querySelectorAll("button");
    botoes.forEach((botao) => {
        botao.disabled = true;
    });

    try {
        await acao();
    } finally {
        botoes.forEach((botao) => {
            botao.disabled = false;
        });
    }
}

async function encaminharUsuarioLogado(tipoAcesso) {
    if (await window.inovarc.ehAdministrador()) {
        window.location.href = paginaPainel;
        return;
    }

    if (tipoAcesso === "admin") {
        const { data: administrador } = await cliente
            .from("administrador")
            .select("aprovado")
            .maybeSingle();

        await cliente.auth.signOut();
        window.alert(administrador
            ? "Seu cadastro administrativo ainda aguarda aprovação."
            : "Esta conta não tem acesso ao painel administrativo.");
        return;
    }

    fecharPainel();
    window.alert("Login realizado. O acompanhamento do cidadão é feito pelo aplicativo.");
}

const acoesFormulario = {
    async cidadao(formulario) {
        await entrarComSenha(formulario, "cidadao");
    },

    async admin(formulario) {
        await entrarComSenha(formulario, "admin");
    },

    async "cadastro-cidadao"(formulario) {
        const senha = conferirSenhas(formulario);
        if (!senha) {
            return;
        }

        const { error } = await cliente.auth.signUp({
            email: formulario.elements.namedItem("email").value.trim(),
            password: senha,
            options: {
                emailRedirectTo: paginaAcesso,
                data: { nome: formulario.elements.namedItem("nome").value.trim() }
            }
        });

        if (error) {
            window.alert(mensagemDeErro(error));
            return;
        }

        formulario.reset();
        abrirPainel("loginCidadao");
        window.alert("Enviamos um link de confirmação para o seu e-mail. Confirme para poder entrar.");
    },

    async "cadastro-admin"(formulario) {
        const cnpj = apenasDigitos(formulario.elements.namedItem("cnpj").value);
        if (!cnpjValido(cnpj)) {
            window.alert("Informe um CNPJ válido.");
            formulario.elements.namedItem("cnpj").focus();
            return;
        }

        const senha = conferirSenhas(formulario);
        if (!senha) {
            return;
        }

        const { error } = await cliente.auth.signUp({
            email: formulario.elements.namedItem("email").value.trim(),
            password: senha,
            options: {
                emailRedirectTo: paginaAcesso,
                data: {
                    tipo: "administrador",
                    nome: formulario.elements.namedItem("responsavel").value.trim(),
                    instituicao: formulario.elements.namedItem("instituicao").value.trim(),
                    cnpj
                }
            }
        });

        if (error) {
            window.alert(mensagemDeErro(error));
            return;
        }

        formulario.reset();
        abrirPainel("loginAdmin");
        window.alert("Enviamos um link de confirmação para o e-mail informado. O acesso ao painel é liberado depois que o cadastro for aprovado.");
    },

    async "nova-senha"(formulario) {
        const senha = conferirSenhas(formulario);
        if (!senha) {
            return;
        }

        const { error } = await cliente.auth.updateUser({ password: senha });
        if (error) {
            window.alert(mensagemDeErro(error));
            return;
        }

        formulario.reset();
        await cliente.auth.signOut();
        fecharPainel();
        window.alert("Senha alterada. Entre novamente com a nova senha.");
    }
};

async function entrarComSenha(formulario, tipoAcesso) {
    const { error } = await cliente.auth.signInWithPassword({
        email: formulario.elements.namedItem("email").value.trim(),
        password: formulario.elements.namedItem("senha").value
    });

    if (error) {
        window.alert(mensagemDeErro(error));
        return;
    }

    formulario.reset();
    await encaminharUsuarioLogado(tipoAcesso);
}

formularios.forEach((formulario) => {
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!sistemaDisponivel()) {
            return;
        }

        await comBotaoOcupado(formulario, () => acoesFormulario[formulario.dataset.form](formulario));
    });
});

document.querySelectorAll("[data-google]").forEach((botao) => {
    botao.addEventListener("click", async () => {
        if (!sistemaDisponivel()) {
            return;
        }

        sessionStorage.setItem(CHAVE_TIPO_ACESSO, botao.dataset.google);

        const { error } = await cliente.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: paginaAcesso }
        });

        if (error) {
            sessionStorage.removeItem(CHAVE_TIPO_ACESSO);
            window.alert("Não foi possível entrar com o Google. Tente novamente.");
        }
    });
});

document.querySelectorAll("[data-esqueci]").forEach((link) => {
    link.addEventListener("click", async (evento) => {
        evento.preventDefault();

        if (!sistemaDisponivel()) {
            return;
        }

        const campoEmail = link.closest("form").elements.namedItem("email");
        const email = campoEmail.value.trim();

        if (!campoEmail.checkValidity() || email === "") {
            window.alert("Digite seu e-mail no campo acima para receber o link de recuperação.");
            campoEmail.focus();
            return;
        }

        const { error } = await cliente.auth.resetPasswordForEmail(email, { redirectTo: paginaAcesso });

        if (error && error.code && error.code.startsWith("over_")) {
            window.alert(mensagemDeErro(error));
            return;
        }

        window.alert("Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.");
    });
});

/* RETORNO DO GOOGLE E DOS LINKS DE E-MAIL */

if (cliente) {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.has("error")) {
        sessionStorage.removeItem(CHAVE_TIPO_ACESSO);
        window.history.replaceState(null, "", paginaAcesso);
        window.alert("Não foi possível concluir o acesso. Tente novamente.");
    }

    cliente.auth.onAuthStateChange((evento, sessao) => {
        if (evento === "PASSWORD_RECOVERY") {
            abrirPainel("novaSenha");
            return;
        }

        const tipoAcesso = sessionStorage.getItem(CHAVE_TIPO_ACESSO);
        if (sessao && tipoAcesso && (evento === "SIGNED_IN" || evento === "INITIAL_SESSION")) {
            sessionStorage.removeItem(CHAVE_TIPO_ACESSO);
            // O Supabase pede para não chamar o cliente de dentro deste callback.
            setTimeout(() => encaminharUsuarioLogado(tipoAcesso), 0);
        }
    });
}
