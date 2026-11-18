
document.addEventListener("DOMContentLoaded", () => {
    let administradores = JSON.parse(
        localStorage.getItem("administradores")
    ) || [];

    // Cria o administrador inicial apenas uma vez
    if (administradores.length === 0) {
        const adminMock = {
            instituicao: "Nova Roma Force",
            cnpj: "00.000.000/0000-00",
            responsavel: "Administrador Inicial",
            email: "admin@inovarc.gov.br",
            senha: "Admin123!"
        };

        administradores.push(adminMock);

        localStorage.setItem(
            "administradores",
            JSON.stringify(administradores)
        );
    }
});
