"use strict";

const escolha = document.getElementById("escolha");
const login = document.getElementById("login");
const overlay = document.getElementById("overlay");
const formularios = document.querySelectorAll(".login-form");
let tipoAcessoAtual = "cidadao";

// Endereço desta página (sem parâmetros), para onde o Google e os e-mails devolvem o usuário.
const paginaAcesso = window.location.origin + window.location.pathname;
const paginaPainel = new URL("../painel/index.html", window.location.href).href;

document.querySelectorAll("img").forEach((imagem) => {
    imagem.addEventListener("error", () => {
        imagem.hidden = true;
    }, { once: true });
});


/* ABRIR E FECHAR OS FORMULÁRIOS */

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
        abrirPainel(link.dataset.abrirCadastro === "cidadao" ? "cadastroCidadao" : "cadastroAdmin");
    });
});

document.getElementById("voltar").addEventListener("click", () => {
    const noCadastro = document.getElementById("cadastroCidadao").classList.contains("ativo")
        || document.getElementById("cadastroAdmin").classList.contains("ativo");

    if (noCadastro) {
        abrirPainel(tipoAcessoAtual === "cidadao" ? "loginCidadao" : "loginAdmin");
    } else {
        fecharPainel();
    }
});

overlay.addEventListener("click", fecharPainel);

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && login.classList.contains("mostrar")) {
        fecharPainel();
    }
});


/* VALIDAÇÕES */

// Mínimo de 8 caracteres, com pelo menos uma letra e um número.
function senhaForte(senha) {
    return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

// Calcula um dígito verificador do CNPJ somando cada número vezes o seu peso.
function digitoCnpj(cnpj, pesos) {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) {
        soma += Number(cnpj[i]) * pesos[i];
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}

function cnpjValido(cnpj) {
    const temCatorzeDigitos = /^\d{14}$/.test(cnpj);
    const todosIguais = /^(\d)\1{13}$/.test(cnpj);

    if (!temCatorzeDigitos || todosIguais) {
        return false;
    }

    const primeiro = digitoCnpj(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const segundo = digitoCnpj(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return primeiro === Number(cnpj[12]) && segundo === Number(cnpj[13]);
}

// Devolve a senha se estiver tudo certo, ou null depois de avisar o usuário.
function conferirSenhas(formulario) {
    const senha = formulario.elements.senha.value;
    const confirmacao = formulario.elements.confirmarSenha.value;

    if (!senhaForte(senha)) {
        alert("A senha precisa ter pelo menos 8 caracteres, com letras e números.");
        formulario.elements.senha.focus();
        return null;
    }

    if (senha !== confirmacao) {
        alert("As senhas não coincidem.");
        formulario.elements.confirmarSenha.focus();
        return null;
    }

    return senha;
}


/* MENSAGENS */

// O texto não diz se o e-mail existe ou não, para ninguém descobrir quem tem conta.
const mensagensDeErro = {
    invalid_credentials: "E-mail ou senha inválidos.",
    email_not_confirmed: "Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.",
    weak_password: "Senha fraca. Use pelo menos 8 caracteres, com letras e números.",
    same_password: "A nova senha precisa ser diferente da atual.",
    over_email_send_rate_limit: "Muitas tentativas. Aguarde alguns minutos.",
    over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos."
};

function mensagemDeErro(erro) {
    return mensagensDeErro[erro.code] || "Não foi possível concluir. Tente novamente.";
}

function bancoDisponivel() {
    if (banco === null) {
        alert("O sistema ainda não está conectado ao banco de dados.");
        return false;
    }
    return true;
}


/* LOGIN */

// Depois de entrar, cada tipo de conta vai para um lugar.
async function irParaOLugarCerto(tipoAcesso) {
    if (await ehAdministrador()) {
        window.location.href = paginaPainel;
        return;
    }

    if (tipoAcesso === "admin") {
        // Se existe um cadastro de administrador, ele só não foi aprovado ainda.
        const { data: cadastro } = await banco.from("administrador").select("aprovado").maybeSingle();
        await banco.auth.signOut();

        if (cadastro) {
            alert("Seu cadastro administrativo ainda aguarda aprovação.");
        } else {
            alert("Esta conta não tem acesso ao painel administrativo.");
        }
        return;
    }

    fecharPainel();
    alert("Login realizado. O acompanhamento do cidadão é feito pelo aplicativo.");
}

async function entrarComSenha(evento, tipoAcesso) {
    evento.preventDefault();
    if (!bancoDisponivel()) {
        return;
    }

    const formulario = evento.target;
    const botao = formulario.querySelector(".btn-login");
    botao.disabled = true;

    const { error } = await banco.auth.signInWithPassword({
        email: formulario.elements.email.value.trim(),
        password: formulario.elements.senha.value
    });

    botao.disabled = false;

    if (error) {
        alert(mensagemDeErro(error));
        return;
    }

    formulario.reset();
    await irParaOLugarCerto(tipoAcesso);
}

document.getElementById("loginCidadao").addEventListener("submit", (evento) => {
    entrarComSenha(evento, "cidadao");
});

document.getElementById("loginAdmin").addEventListener("submit", (evento) => {
    entrarComSenha(evento, "admin");
});


/* CADASTRO */

const formCadastroCidadao = document.getElementById("cadastroCidadao");

formCadastroCidadao.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!bancoDisponivel()) {
        return;
    }

    const senha = conferirSenhas(formCadastroCidadao);
    if (senha === null) {
        return;
    }

    const botao = formCadastroCidadao.querySelector(".btn-login");
    botao.disabled = true;

    const { error } = await banco.auth.signUp({
        email: formCadastroCidadao.elements.email.value.trim(),
        password: senha,
        options: {
            emailRedirectTo: paginaAcesso,
            data: { nome: formCadastroCidadao.elements.nome.value.trim() }
        }
    });

    botao.disabled = false;

    if (error) {
        alert(mensagemDeErro(error));
        return;
    }

    formCadastroCidadao.reset();
    abrirPainel("loginCidadao");
    alert("Enviamos um link de confirmação para o seu e-mail. Confirme para poder entrar.");
});

const formCadastroAdmin = document.getElementById("cadastroAdmin");

formCadastroAdmin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!bancoDisponivel()) {
        return;
    }

    const cnpj = formCadastroAdmin.elements.cnpj.value.replace(/\D/g, "");
    if (!cnpjValido(cnpj)) {
        alert("Informe um CNPJ válido.");
        formCadastroAdmin.elements.cnpj.focus();
        return;
    }

    const senha = conferirSenhas(formCadastroAdmin);
    if (senha === null) {
        return;
    }

    const botao = formCadastroAdmin.querySelector(".btn-login");
    botao.disabled = true;

    const { error } = await banco.auth.signUp({
        email: formCadastroAdmin.elements.email.value.trim(),
        password: senha,
        options: {
            emailRedirectTo: paginaAcesso,
            data: {
                tipo: "administrador",
                nome: formCadastroAdmin.elements.responsavel.value.trim(),
                instituicao: formCadastroAdmin.elements.instituicao.value.trim(),
                cnpj: cnpj
            }
        }
    });

    botao.disabled = false;

    if (error) {
        alert(mensagemDeErro(error));
        return;
    }

    formCadastroAdmin.reset();
    abrirPainel("loginAdmin");
    alert("Enviamos um link de confirmação para o e-mail informado. O painel é liberado depois que o cadastro for aprovado.");
});


/* LOGIN COM GOOGLE */

// O Google leva o usuário para fora do site e depois devolve para esta página.
// Por isso guardamos de qual botão ele saiu, para saber para onde mandar quando voltar.
document.querySelectorAll("[data-google]").forEach((botao) => {
    botao.addEventListener("click", async () => {
        if (!bancoDisponivel()) {
            return;
        }

        sessionStorage.setItem("tipoAcessoGoogle", botao.dataset.google);

        const { error } = await banco.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: paginaAcesso }
        });

        if (error) {
            sessionStorage.removeItem("tipoAcessoGoogle");
            alert("Não foi possível entrar com o Google. Tente novamente.");
        }
    });
});

async function terminarLoginGoogle() {
    const tipoAcesso = sessionStorage.getItem("tipoAcessoGoogle");
    if (tipoAcesso === null) {
        return;
    }

    const { data } = await banco.auth.getSession();
    if (data.session !== null) {
        sessionStorage.removeItem("tipoAcessoGoogle");
        irParaOLugarCerto(tipoAcesso);
    }
}


/* RECUPERAR SENHA */

document.querySelectorAll("[data-esqueci]").forEach((link) => {
    link.addEventListener("click", async (evento) => {
        evento.preventDefault();
        if (!bancoDisponivel()) {
            return;
        }

        const campoEmail = link.closest("form").elements.email;
        if (campoEmail.value.trim() === "" || !campoEmail.checkValidity()) {
            alert("Digite seu e-mail no campo acima para receber o link de recuperação.");
            campoEmail.focus();
            return;
        }

        const { error } = await banco.auth.resetPasswordForEmail(campoEmail.value.trim(), {
            redirectTo: paginaAcesso
        });

        if (error && mensagensDeErro[error.code]) {
            alert(mensagemDeErro(error));
            return;
        }

        // Mesma resposta exista a conta ou não.
        alert("Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.");
    });
});

// Quem abre o link do e-mail cai aqui e escolhe a nova senha.
document.getElementById("novaSenha").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!bancoDisponivel()) {
        return;
    }

    const formulario = evento.target;
    const senha = conferirSenhas(formulario);
    if (senha === null) {
        return;
    }

    const { error } = await banco.auth.updateUser({ password: senha });

    if (error) {
        alert(mensagemDeErro(error));
        return;
    }

    formulario.reset();
    await banco.auth.signOut();
    fecharPainel();
    alert("Senha alterada. Entre novamente com a nova senha.");
});


/* AO CARREGAR A PÁGINA */

if (banco !== null) {
    banco.auth.onAuthStateChange((evento) => {
        if (evento === "PASSWORD_RECOVERY") {
            abrirPainel("novaSenha");
        }
    });

    // Link de erro devolvido pelo Supabase, por exemplo link de e-mail vencido.
    if (new URLSearchParams(window.location.search).has("error")) {
        sessionStorage.removeItem("tipoAcessoGoogle");
        window.history.replaceState(null, "", paginaAcesso);
        alert("Não foi possível concluir o acesso. Tente novamente.");
    }

    terminarLoginGoogle();
}
