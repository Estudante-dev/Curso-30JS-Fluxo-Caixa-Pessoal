const CHAVE_ARMAZENAMENTO = "fluxoCaixaPessoal_transacoes";

const elementoTotalEntradas = document.getElementById("total-entradas");
const elementoTotalSaidas = document.getElementById("total-saidas");
const elementoSaldoAtual = document.getElementById("saldo-atual");
const elementoCartaoSaldo = document.getElementById("cartao-saldo");
const elementoFormulario = document.getElementById("formulario-transacao");
const elementoListaTransacoes = document.getElementById("lista-transacoes");
const elementoMensagemVazia = document.getElementById("mensagem-vazia");
const elementoCampoBusca = document.getElementById("campo-busca");
const elementoPorcentagemGastos = document.getElementById("porcentagem-gastos");
const elementoTextoProporcao = document.getElementById("texto-proporcao");
const elementoGraficoRosca = document.getElementById("grafico-rosca");
const botoesFiltro = document.querySelectorAll(".botao-filtro");

let listaTransacoes = [];
let filtroTipoAtual = "todas";
let termoBuscaAtual = "";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatarMoeda(valor) {
  return formatadorMoeda.format(valor);
}

function carregarDoLocalStorage() {
  const dadosSalvos = localStorage.getItem(CHAVE_ARMAZENAMENTO);

  if (!dadosSalvos) {
    return [];
  }

  try {
    const dadosConvertidos = JSON.parse(dadosSalvos);
    return Array.isArray(dadosConvertidos) ? dadosConvertidos : [];
  } catch (erro) {
    console.error("Não foi possível ler as transações salvas:", erro);
    return [];
  }
}

function salvarNoLocalStorage() {
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(listaTransacoes));
}

function criarTransacao(descricao, valor, tipo, categoria) {
  return {
    id: Date.now(),
    descricao: descricao.trim(),
    valor: Number(valor),
    tipo,
    categoria,
  };
}

function adicionarTransacao(evento) {
  evento.preventDefault();

  const campoDescricao = document.getElementById("descricao");
  const campoValor = document.getElementById("valor");
  const campoCategoria = document.getElementById("categoria");
  const tipoSelecionado = document.querySelector('input[name="tipo"]:checked');

  const descricao = campoDescricao.value;
  const valor = Number(campoValor.value);
  const categoria = campoCategoria.value;
  const tipo = tipoSelecionado.value;

  if (!descricao.trim() || !categoria || Number.isNaN(valor) || valor <= 0) {
    return;
  }

  const novaTransacao = criarTransacao(descricao, valor, tipo, categoria);
  listaTransacoes = [novaTransacao, ...listaTransacoes];

  salvarNoLocalStorage();
  atualizarInterface();
  elementoFormulario.reset();
  document.querySelector('input[name="tipo"][value="receita"]').checked = true;
  campoDescricao.focus();
}

function removerTransacao(idTransacao) {
  listaTransacoes = listaTransacoes.filter(
    (transacao) => transacao.id !== idTransacao
  );

  salvarNoLocalStorage();
  atualizarInterface();
}

function calcularTotais(transacoes) {
  const totalEntradas = transacoes
    .filter((transacao) => transacao.tipo === "receita")
    .reduce((acumulador, transacao) => acumulador + transacao.valor, 0);

  const totalSaidas = transacoes
    .filter((transacao) => transacao.tipo === "despesa")
    .reduce((acumulador, transacao) => acumulador + transacao.valor, 0);

  const saldoAtual = totalEntradas - totalSaidas;

  return { totalEntradas, totalSaidas, saldoAtual };
}

function atualizarPainel() {
  const { totalEntradas, totalSaidas, saldoAtual } =
    calcularTotais(listaTransacoes);

  elementoTotalEntradas.textContent = formatarMoeda(totalEntradas);
  elementoTotalSaidas.textContent = formatarMoeda(totalSaidas);
  elementoSaldoAtual.textContent = formatarMoeda(saldoAtual);

  elementoCartaoSaldo.classList.remove(
    "cartao--saldo-positivo",
    "cartao--saldo-negativo"
  );

  if (saldoAtual >= 0) {
    elementoCartaoSaldo.classList.add("cartao--saldo-positivo");
  } else {
    elementoCartaoSaldo.classList.add("cartao--saldo-negativo");
  }

  atualizarGraficoProporcao(totalEntradas, totalSaidas);
}

function atualizarGraficoProporcao(totalEntradas, totalSaidas) {
  elementoTextoProporcao.classList.remove("alerta", "critico");

  if (totalEntradas === 0 && totalSaidas === 0) {
    elementoPorcentagemGastos.textContent = "0%";
    elementoTextoProporcao.textContent = "Sem movimentações ainda.";
    elementoGraficoRosca.style.setProperty("--fatia-despesas", "0deg");
    elementoGraficoRosca.style.setProperty("--cor-fatia", "var(--cor-saida)");
    return;
  }

  if (totalEntradas === 0 && totalSaidas > 0) {
    elementoPorcentagemGastos.textContent = "100%+";
    elementoTextoProporcao.textContent =
      "Há despesas sem receitas registradas. Revise seu fluxo.";
    elementoTextoProporcao.classList.add("critico");
    elementoGraficoRosca.style.setProperty("--fatia-despesas", "360deg");
    elementoGraficoRosca.style.setProperty("--cor-fatia", "var(--cor-saida)");
    return;
  }

  const porcentagemGastos = (totalSaidas / totalEntradas) * 100;
  const porcentagemLimitada = Math.min(porcentagemGastos, 100);
  const grausDespesas = (porcentagemLimitada / 100) * 360;

  elementoPorcentagemGastos.textContent = `${Math.round(porcentagemGastos)}%`;
  elementoGraficoRosca.style.setProperty(
    "--fatia-despesas",
    `${grausDespesas}deg`
  );

  if (porcentagemGastos > 100) {
    elementoTextoProporcao.textContent =
      "As despesas ultrapassaram 100% das receitas.";
    elementoTextoProporcao.classList.add("critico");
    elementoGraficoRosca.style.setProperty("--cor-fatia", "var(--cor-saida)");
  } else if (porcentagemGastos >= 75) {
    elementoTextoProporcao.textContent =
      "Atenção: os gastos já passaram de 75% das receitas.";
    elementoTextoProporcao.classList.add("alerta");
    elementoGraficoRosca.style.setProperty("--cor-fatia", "var(--cor-alerta)");
  } else {
    elementoTextoProporcao.textContent =
      "Seus gastos estão sob controle em relação às receitas.";
    elementoGraficoRosca.style.setProperty("--cor-fatia", "var(--cor-entrada)");
  }
}

function obterTransacoesFiltradas() {
  return listaTransacoes.filter((transacao) => {
    const correspondeTipo =
      filtroTipoAtual === "todas" ||
      (filtroTipoAtual === "receitas" && transacao.tipo === "receita") ||
      (filtroTipoAtual === "despesas" && transacao.tipo === "despesa");

    const descricaoNormalizada = transacao.descricao.toLowerCase();
    const termoNormalizado = termoBuscaAtual.trim().toLowerCase();
    const correspondeBusca =
      termoNormalizado === "" ||
      descricaoNormalizada.includes(termoNormalizado);

    return correspondeTipo && correspondeBusca;
  });
}

function montarItemTransacao(transacao) {
  const sinal = transacao.tipo === "receita" ? "+" : "-";
  const classeTipo =
    transacao.tipo === "receita"
      ? "item-transacao--receita"
      : "item-transacao--despesa";

  return `
    <li class="item-transacao ${classeTipo}" data-id="${transacao.id}">
      <div class="item-transacao__info">
        <p class="item-transacao__descricao">${escaparHtml(transacao.descricao)}</p>
        <p class="item-transacao__categoria">${escaparHtml(transacao.categoria)}</p>
      </div>
      <p class="item-transacao__valor">${sinal} ${formatarMoeda(transacao.valor)}</p>
      <button
        type="button"
        class="botao-excluir"
        data-id="${transacao.id}"
        aria-label="Excluir transação ${escaparHtml(transacao.descricao)}"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1zm1 2v0h4V5h-4zM6 9h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9zm3 2v8h2v-8H9zm4 0v8h2v-8h-2z"/>
        </svg>
      </button>
    </li>
  `;
}

function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderizarHistorico() {
  const transacoesFiltradas = obterTransacoesFiltradas();

  if (transacoesFiltradas.length === 0) {
    elementoListaTransacoes.innerHTML = "";
    elementoMensagemVazia.classList.add("visivel");
    return;
  }

  elementoMensagemVazia.classList.remove("visivel");
  elementoListaTransacoes.innerHTML = transacoesFiltradas
    .map(montarItemTransacao)
    .join("");
}

function atualizarInterface() {
  atualizarPainel();
  renderizarHistorico();
}

function tratarCliqueNaLista(evento) {
  const botaoExcluir = evento.target.closest(".botao-excluir");

  if (!botaoExcluir) {
    return;
  }

  const idTransacao = Number(botaoExcluir.dataset.id);
  removerTransacao(idTransacao);
}

function tratarFiltroRapido(evento) {
  const botao = evento.currentTarget;
  filtroTipoAtual = botao.dataset.filtro;

  botoesFiltro.forEach((item) => item.classList.remove("ativo"));
  botao.classList.add("ativo");

  renderizarHistorico();
}

function tratarBusca(evento) {
  termoBuscaAtual = evento.target.value;
  renderizarHistorico();
}

function iniciarAplicacao() {
  listaTransacoes = carregarDoLocalStorage();
  atualizarInterface();

  elementoFormulario.addEventListener("submit", adicionarTransacao);
  elementoListaTransacoes.addEventListener("click", tratarCliqueNaLista);
  elementoCampoBusca.addEventListener("input", tratarBusca);

  botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", tratarFiltroRapido);
  });
}

iniciarAplicacao();
