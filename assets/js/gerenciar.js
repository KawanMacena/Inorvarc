"use strict";

const idOcorrencia = Number(new URLSearchParams(window.location.search).get("id"));
const paginaPainel = "../painel/index.html";

const statusAtual = document.querySelector(".status-atual");
const opcoesStatus = document.querySelectorAll(".opcoes-status button");
const listaNotas = document.querySelector(".lista-notas");
const campoNotas = document.querySelector(".notas textarea");
const botaoSalvarNotas = document.querySelector(".salvar-notas");

function voltarAoPainel(mensagem) {
    if (mensagem) {
        alert(mensagem);
    }
    window.location.href = paginaPainel;
}

function marcarStatus(status) {
    statusAtual.textContent = nomesDeStatus[status];

    opcoesStatus.forEach((botao) => {
        botao.classList.toggle("selecionado", botao.dataset.status === status);
    });
}

function linkDoMapa(localizacao) {
    if (!localizacao) {
        return null;
    }

    const busca = localizacao.latitude !== null
        ? localizacao.latitude + "," + localizacao.longitude
        : localizacao.endereco;

    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(busca);
}

async function mostrarFotos(imagens) {
    const area = document.getElementById("fotos");
    const legenda = document.getElementById("legendaFoto");

    if (imagens.length === 0) {
        legenda.textContent = "Nenhuma foto enviada.";
        return;
    }

    const caminhos = imagens.map((imagem) => imagem.url);
    const { data, error } = await banco.storage.from("ocorrencias").createSignedUrls(caminhos, 3600);

    if (error) {
        legenda.textContent = "Não foi possível carregar as fotos.";
        return;
    }

    data.forEach((arquivo) => {
        const foto = document.createElement("img");
        foto.src = arquivo.signedUrl;
        foto.alt = "Foto do problema";
        area.append(foto);
    });

    legenda.textContent = "Foto encaminhada pelo cidadão";
}

function preencherOcorrencia(ocorrencia) {
    document.getElementById("categoria").textContent = "Categoria: " + ocorrencia.categoria.nome;
    document.getElementById("endereco").textContent = textoDoLocal(ocorrencia.localizacao);
    document.getElementById("descricao").textContent = ocorrencia.descricao;
    document.getElementById("dataRecebimento").textContent = formatarData(ocorrencia.data_registro);
    document.getElementById("reportadoPor").textContent = ocorrencia.usuario
        ? ocorrencia.usuario.nome
        : "Cidadão não identificado";

    const link = document.getElementById("linkMapa");
    const endereco = linkDoMapa(ocorrencia.localizacao);
    if (endereco !== null) {
        link.href = endereco;
        link.hidden = false;
    }

    marcarStatus(ocorrencia.status_atual);
    mostrarFotos(ocorrencia.imagem);
}

async function carregarOcorrencia() {
    const { data, error } = await banco
        .from("ocorrencia")
        .select("id_ocorrencia, descricao, status_atual, data_registro, categoria(nome), localizacao(endereco, latitude, longitude), usuario(nome), imagem(url)")
        .eq("id_ocorrencia", idOcorrencia)
        .maybeSingle();

    if (error || data === null) {
        voltarAoPainel("Ocorrência não encontrada.");
        return false;
    }

    preencherOcorrencia(data);
    return true;
}

function criarNota(nota) {
    const autor = nota.administrador ? nota.administrador.nome : "Administrador";

    const cabecalho = document.createElement("strong");
    cabecalho.textContent = autor + " - " + formatarData(nota.data_registro);

    const texto = document.createElement("p");
    texto.className = "texto-livre";
    texto.textContent = nota.conteudo;

    const item = document.createElement("li");
    item.append(cabecalho, texto);
    return item;
}

async function carregarNotas() {
    const { data, error } = await banco
        .from("nota_ocorrencia")
        .select("id_nota, conteudo, data_registro, administrador(nome)")
        .eq("id_ocorrencia", idOcorrencia)
        .order("data_registro", { ascending: false });

    if (error) {
        alert("Não foi possível carregar as notas.");
        return;
    }

    listaNotas.replaceChildren(...data.map(criarNota));
}

opcoesStatus.forEach((botao) => {
    botao.addEventListener("click", async () => {
        const novoStatus = botao.dataset.status;

        const { data, error } = await banco
            .from("ocorrencia")
            .update({ status_atual: novoStatus })
            .eq("id_ocorrencia", idOcorrencia)
            .select("status_atual");

        if (error || data.length === 0) {
            alert("Não foi possível atualizar o status.");
            return;
        }

        marcarStatus(novoStatus);
    });
});

botaoSalvarNotas.addEventListener("click", async () => {
    const conteudo = campoNotas.value.trim();

    if (conteudo === "") {
        alert("Digite uma observação antes de salvar.");
        return;
    }

    botaoSalvarNotas.disabled = true;

    const { data, error } = await banco
        .from("nota_ocorrencia")
        .insert({ id_ocorrencia: idOcorrencia, conteudo: conteudo })
        .select("id_nota, conteudo, data_registro, administrador(nome)")
        .single();

    botaoSalvarNotas.disabled = false;

    if (error) {
        alert("Não foi possível salvar a nota.");
        return;
    }

    listaNotas.prepend(criarNota(data));
    campoNotas.value = "";
});

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

document.querySelector(".imprimir").addEventListener("click", () => {
    window.print();
});

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

document.querySelector(".voltar").addEventListener("click", () => {
    voltarAoPainel();
});

async function iniciar() {
    if (!(await protegerPagina())) {
        return;
    }

    if (!Number.isInteger(idOcorrencia) || idOcorrencia <= 0) {
        voltarAoPainel();
        return;
    }

    localStorage.removeItem("notasGerenciamento");

    if (await carregarOcorrencia()) {
        carregarNotas();
    }
}

iniciar();
