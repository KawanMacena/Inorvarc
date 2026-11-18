
/* GERENCIAMENTO DE OCORRÊNCIAS */


/* ELEMENTOS */
const statusAtual = document.querySelector(".status-atual");
const opcoesStatus = document.querySelectorAll(".opcoes-status button");

const campoNotas = document.querySelector(".notas textarea");
const botaoSalvarNotas = document.querySelector(".salvar-notas");


/* STATUS DA SOLICITAÇÃO */

// Define o status inicial
statusAtual.textContent = "Não definido";

opcoesStatus.forEach(botao => {

    botao.addEventListener("click", () => {

        // Remove a seleção anterior
        opcoesStatus.forEach(opcao => {
            opcao.classList.remove("selecionado");
        });

        // Seleciona o botão clicado
        botao.classList.add("selecionado");

        // Atualiza o status atual
        statusAtual.textContent = botao.textContent;

    });

});


/* NOTAS INTERNAS */

// Recupera as notas salvas
campoNotas.value =
    localStorage.getItem("notasGerenciamento") || "";


botaoSalvarNotas.addEventListener("click", () => {

    const notas = campoNotas.value.trim();

    if (notas === "") {

        alert("Digite uma observação antes de salvar.");

        return;
    }

    // Salva as notas no navegador
    localStorage.setItem("notasGerenciamento", notas);

    alert("Notas salvas com sucesso!");

});


/* ATRIBUIR EQUIPE */

const botaoAtribuir = document.querySelector(".atribuir");

botaoAtribuir.addEventListener("click", () => {

    const equipe = prompt("Digite o nome da equipe responsável:");

    if (equipe === null) {
        return;
    }

    if (equipe.trim() === "") {

        alert("Informe o nome da equipe.");

        return;
    }

    alert("Equipe atribuída: " + equipe);

});


/* IMPRIMIR RELATÓRIO */

const botaoImprimir = document.querySelector(".imprimir");

botaoImprimir.addEventListener("click", () => {

    window.print();

});


/* COMPARTILHAR */

const botaoCompartilhar = document.querySelector(
    ".compartilhar"
);

botaoCompartilhar.addEventListener("click", async () => {

    const dados = {
        title: "Gerenciamento",
        text: "Confira a tela de gerenciamento.",
        url: window.location.href
    };

    try {

        if (navigator.share) {

            await navigator.share(dados);

        } else {

            await navigator.clipboard.writeText(
                dados.url
            );

            alert("Link copiado com sucesso!");

        }

    } catch (erro) {

        if (erro.name !== "AbortError") {
            alert("Não foi possível compartilhar.");
        }

    }

});


/* BOTÃO VOLTAR */

const botaoVoltar = document.querySelector(".voltar");

botaoVoltar.addEventListener("click", () => {

    window.history.back();

});

// Função imprimir relatorio

function downloadPDF() {

    html2pdf().from(item).save();
         
}
