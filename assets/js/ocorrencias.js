"use strict";

const nomesDeStatus = {
    pendente: "Pendente",
    em_analise: "Em análise",
    em_andamento: "Em andamento",
    concluido: "Concluído"
};

function formatarData(dataTexto) {
    return new Date(dataTexto).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function tempoDecorrido(dataTexto) {
    const minutos = Math.floor((Date.now() - new Date(dataTexto).getTime()) / 60000);

    if (minutos < 1) {
        return "agora";
    }

    if (minutos < 60) {
        return minutos + " min atrás";
    }

    const horas = Math.floor(minutos / 60);
    if (horas < 24) {
        return horas + "h atrás";
    }

    const dias = Math.floor(horas / 24);
    if (dias < 30) {
        return dias === 1 ? "1 dia atrás" : dias + " dias atrás";
    }

    return formatarData(dataTexto);
}

function textoDoLocal(localizacao) {
    if (!localizacao) {
        return "Não informado";
    }

    if (localizacao.endereco) {
        return localizacao.endereco;
    }

    return localizacao.latitude + ", " + localizacao.longitude;
}
