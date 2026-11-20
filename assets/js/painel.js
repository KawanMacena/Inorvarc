"use strict";

const campoBusca = document.getElementById("busca");
const filtroStatus = document.getElementById("filtroStatus");
const corpoTabela = document.getElementById("corpoTabela");
const contadorPendentes = document.getElementById("contadorPendentes");

let ocorrencias = [];

function semAcento(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function resumir(texto, limite) {
    return texto.length > limite ? texto.slice(0, limite) + "…" : texto;
}

function criarCelula(texto) {
    const celula = document.createElement("td");
    celula.textContent = texto;
    return celula;
}

function mostrarMensagem(texto) {
    const celula = criarCelula(texto);
    celula.colSpan = 7;

    const linha = document.createElement("tr");
    linha.append(celula);
    corpoTabela.replaceChildren(linha);
}

function criarLinha(ocorrencia) {
    const link = document.createElement("a");
    link.href = "../gerenciar/index.html?id=" + ocorrencia.id_ocorrencia;
    link.textContent = "Ver detalhes";

    const celulaLink = document.createElement("td");
    celulaLink.append(link);

    const linha = document.createElement("tr");
    linha.append(
        criarCelula("#" + ocorrencia.id_ocorrencia),
        criarCelula(ocorrencia.categoria.nome),
        criarCelula(textoDoLocal(ocorrencia.localizacao)),
        criarCelula(resumir(ocorrencia.descricao, 80)),
        criarCelula(nomesDeStatus[ocorrencia.status_atual]),
        criarCelula(tempoDecorrido(ocorrencia.data_registro)),
        celulaLink
    );
    return linha;
}

function desenharTabela() {
    const termo = semAcento(campoBusca.value.trim());
    const status = filtroStatus.value;

    const filtradas = ocorrencias.filter((ocorrencia) => {
        if (status !== "" && ocorrencia.status_atual !== status) {
            return false;
        }

        const texto = [
            ocorrencia.categoria.nome,
            textoDoLocal(ocorrencia.localizacao),
            ocorrencia.descricao
        ].join(" ");

        return semAcento(texto).includes(termo);
    });

    if (filtradas.length === 0) {
        mostrarMensagem(ocorrencias.length === 0
            ? "Nenhuma ocorrência registrada ainda."
            : "Nenhuma ocorrência encontrada.");
        return;
    }

    corpoTabela.replaceChildren(...filtradas.map(criarLinha));
}

async function carregarOcorrencias() {
    mostrarMensagem("Carregando...");

    const { data, error } = await banco
        .from("ocorrencia")
        .select("id_ocorrencia, descricao, status_atual, data_registro, categoria(nome), localizacao(endereco, latitude, longitude)")
        .order("data_registro", { ascending: false })
        .limit(500);

    if (error) {
        mostrarMensagem("Não foi possível carregar as ocorrências.");
        return;
    }

    ocorrencias = data;
    desenharTabela();
}

async function carregarTotais() {
    const todosOsStatus = Object.keys(nomesDeStatus);

    const respostas = await Promise.all(todosOsStatus.map((status) => {
        return banco
            .from("ocorrencia")
            .select("*", { count: "exact", head: true })
            .eq("status_atual", status);
    }));

    respostas.forEach((resposta, i) => {
        const campo = document.querySelector('[data-total="' + todosOsStatus[i] + '"]');
        campo.textContent = resposta.error ? "-" : resposta.count;
    });

    contadorPendentes.textContent = document.querySelector('[data-total="pendente"]').textContent;
}

async function iniciar() {
    if (!(await protegerPagina())) {
        return;
    }

    campoBusca.addEventListener("input", desenharTabela);
    filtroStatus.addEventListener("change", desenharTabela);

    carregarTotais();
    carregarOcorrencias();
}

iniciar();
