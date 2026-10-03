document.addEventListener("DOMContentLoaded", () => {
    // 1. VERIFICAÇÃO DE CADASTRO E LOGIN
    const usuarioLogado = localStorage.getItem("usuarioLogado");
    const cadastrado = localStorage.getItem("dadosCadastroAdmin");

    // Identifica em qual página o usuário está
    const paginaAtual = window.location.pathname.split("/").pop();

    // Se estiver na tela de cadastro, mas já possui cadastro e login salvos -> vai para o serviço
    if (paginaAtual === "tela_cadastro.html" || paginaAtual === "") {
        if (usuarioLogado) {
            window.location.href = "../tela-servicos/servico.html"; // Redireciona para tela de serviço
            return;
        } else if (cadastrado) {
            window.location.href = "../login.html"; // Redireciona para login se já tem cadastro
            return;
        }
    }

    2. //MOCK DOS DADOS PARA REFERÊNCIA
    const dadosMock = {
        instituicao: "Nova Roma Force",
        cnpj: "99.888.777/6665-40",
        responsavel: "Jucelino Silva",
        email: "Jucelino.jj@exemplo.gov.br",
        senha: "senhapass321",
        confirmarSenha: "senhapass321"
    };

    const formCadastro = document.getElementById("cadastroAdmin");

    if (formCadastro) {
        // 3. ENVIO DO FORMULÁRIO DE CADASTRO
        formCadastro.addEventListener("submit", (e) => {
            e.preventDefault();

            const senha = document.getElementById("senhaCadastroAdmin").value;
            const confirmarSenha = document.getElementById("confirmarSenhaAdmin").value;

            if (senha !== confirmarSenha) {
                alert("As senhas não coincidem!");
                return;
            }

            // Salva os dados cadastrados no localStorage
            const novoCadastro = {
                instituicao: document.getElementById("instituicaoAdmin").value,
                cnpj: document.getElementById("cnpjCadastroAdmin").value,
                responsavel: document.getElementById("responsavelAdmin").value,
                email: document.getElementById("emailAdmin").value,
                senha: senha
            };

            localStorage.setItem("dadosCadastroAdmin", JSON.stringify(novoCadastro));
            alert("Cadastro realizado com sucesso!");


        });
    }
});