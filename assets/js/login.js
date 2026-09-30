function abrirLogin(tipo) {
    var escolha = document.getElementById("escolha");
    var login = document.getElementById("login");
    var cidadao = document.getElementById("loginCidadao");
    var admin = document.getElementById("loginAdmin");
    var overlay = document.getElementById("overlay");

    overlay.classList.add("ativo");
    escolha.classList.add("esconder");
    login.classList.add("mostrar");

    if (tipo === "cidadao") {
        cidadao.classList.add("ativo");
        admin.classList.remove("ativo");
    } else {
        admin.classList.add("ativo");
        cidadao.classList.remove("ativo");
    }
}

function voltar() {
    var escolha = document.getElementById("escolha");
    var login = document.getElementById("login");
    var overlay = document.getElementById("overlay");

    escolha.classList.remove("esconder");
    overlay.classList.remove("ativo");
    login.classList.remove("mostrar");
}

function entrar(tipo) {
    if (tipo === "admin") {
        var cnpj = document.getElementById("CNPJ").value;
        var senha = document.getElementById("senhaAdmin").value;

        if (cnpj === "" || senha === "") {
            alert("Preencha CNPJ e senha.");
            return;
        }

        location.href = "../painel/index.html";
        return;
    }

    var email = document.getElementById("email").value;
    var senhaCidadao = document.getElementById("senhaCidadao").value;

    if (email === "" || senhaCidadao === "") {
        alert("Preencha e-mail e senha.");
        return;
    }

    alert("O acompanhamento do cidadão é feito pelo aplicativo.");
}
