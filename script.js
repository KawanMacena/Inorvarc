"use strict";

const escolha = document.getElementById("escolha");
const login = document.getElementById("login");
const overlay = document.getElementById("overlay");
const formularios = document.querySelectorAll(".login-form");
let tipoAcessoAtual = "cidadao";

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

document.querySelectorAll("[data-aviso]").forEach((link) => {
    link.addEventListener("click", (evento) => {
        evento.preventDefault();
        window.alert(link.dataset.aviso);
    });
});

formularios.forEach((formulario) => {
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const tipoFormulario = formulario.dataset.form;
        if (tipoFormulario.startsWith("cadastro-")) {
            const senha = formulario.elements.namedItem("senha").value;
            const confirmarSenha = formulario.elements.namedItem("confirmarSenha").value;

            if (senha !== confirmarSenha) {
                window.alert("As senhas não coincidem.");
                formulario.elements.namedItem("confirmarSenha").focus();
                return;
            }

            window.alert("Os dados foram validados, mas o cadastro precisa ser conectado a um servidor para criar a conta.");
            return;
        }

        window.alert("O login precisa ser conectado ao sistema para autenticar sua conta.");
    });
});
