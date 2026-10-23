
function validarLoginAdmin(event) {
    if (event) {
        event.preventDefault();
    }

    const cnpj = document.getElementById("CNPJ").value.trim();
    const senha = document.getElementById("senha").value;

    const administradores = JSON.parse(
        localStorage.getItem("administradores")
    ) || [];

    const adminEncontrado = administradores.find(admin =>
        admin.cnpj === cnpj && admin.senha === senha
    );

    if (!adminEncontrado) {
        alert("CNPJ ou senha incorretos!");
        return;
    }

    // Guarda os dados do administrador autenticado
    localStorage.setItem(
        "usuarioLogado",
        JSON.stringify({
            instituicao: adminEncontrado.instituicao,
            cnpj: adminEncontrado.cnpj,
            responsavel: adminEncontrado.responsavel,
            email: adminEncontrado.email
        })
    );

    // Abre a tela de serviços
    window.location.href = "../paginas/servico.html";
}
