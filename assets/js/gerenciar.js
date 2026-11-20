"use strict";

/* GERENCIAMENTO DE OCORRÊNCIAS */

/* ELEMENTOS */
const statusAtual = document.querySelector(".status-atual");
const opcoesStatus = document.querySelectorAll(".opcoes-status button");

const campoNotas = document.querySelector(".notas textarea");
const botaoSalvarNotas = document.querySelector(".salvar-notas");

/* STATUS DA SOLICITAÇÃO */
statusAtual.textContent = "Não definido";

opcoesStatus.forEach((botao) => {
    botao.addEventListener("click", () => {
        opcoesStatus.forEach((opcao) => {
            opcao.classList.remove("selecionado");
        });

        botao.classList.add("selecionado");
        statusAtual.textContent = botao.textContent;
    });
});

/* NOTAS INTERNAS */
// Ainda ficam no navegador; passam para a tabela nota_ocorrencia quando a tela ler a ocorrência do banco.
campoNotas.value = localStorage.getItem("notasGerenciamento") || "";

botaoSalvarNotas.addEventListener("click", () => {
    const notas = campoNotas.value.trim();

    if (notas === "") {
        alert("Digite uma observação antes de salvar.");
        return;
    }

    localStorage.setItem("notasGerenciamento", notas);
    alert("Notas salvas com sucesso!");
});

/* ATRIBUIR EQUIPE */
document.querySelector(".atribuir").addEventListener("click", () => {
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
document.querySelector(".imprimir").addEventListener("click", () => {
    window.print();
});

/* COMPARTILHAR */
document.querySelector(".compartilhar").addEventListener("click", async () => {
    const dados = {
        title: "Gerenciamento",
        text: "Confira a tela de gerenciamento.",
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(dados);
        } else {
            await navigator.clipboard.writeText(dados.url);
            alert("Link copiado com sucesso!");
        }
    } catch (erro) {
        if (erro.name !== "AbortError") {
            alert("Não foi possível compartilhar.");
        }
    }
});

/* BOTÃO VOLTAR */
document.querySelector(".voltar").addEventListener("click", () => {
    window.location.href = "../painel/index.html";
});
