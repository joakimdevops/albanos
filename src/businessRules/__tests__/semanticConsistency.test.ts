/**
 * Suite de Testes de Consistência Semântica e Decisão Comercial Albanos
 * Valida os 21 pontos especificados na revisão arquitetural.
 */

import { ESTADO_INICIAL, WHATSAPP_ALBANOS_NUMERO } from '../domainConfig';
import { aplicarMudancaEstado } from '../dependenciesEngine';
import { calcularDimensionamento } from '../dimensioningEngine';
import { criarEstadoInicial, importarParametrosURL, parsearParametrosUrl } from '../urlAdapter';
import { calcularOrcamento } from '../budgetEngine';
import { gerarTextoMensagemWhatsApp, gerarLinkWhatsApp } from '../whatsappAdapter';
import { obterDataHojeIso } from '../logisticsEngine';
import { determinarEtapaPorGates } from '../gatesEngine';
import {
  validarInteiroEstrito,
  parsearInteiroEstrito,
  validarInteiroPositivoEstrito,
  validarInteiroNaoNegativoEstrito,
  validarNomeLead,
  validarTelefoneLead,
  validarEmailLead,
  validarDuracaoHoras,
  validarHorarioValido,
  validarDataIsoValida,
  validarDataEvento,
  validarParcelasCartao,
  validarGateIdentificacao,
} from '../validators';
import { CalculatorState } from '../../types';

let totalTests = 0;
let passedTests = 0;

function assert(condicao: boolean, descricao: string) {
  totalTests++;
  if (condicao) {
    passedTests++;
    console.log(`  ✓ ${descricao}`);
  } else {
    console.error(`  ✗ FALHA: ${descricao}`);
    throw new Error(`Falha no teste: ${descricao}`);
  }
}

console.log('\n======================================================');
console.log('TESTES DE CONSISTÊNCIA SEMÂNTICA (ALBANOS CHOPE)');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// GRUPO 1: QUANTIDADE DE BARRIS (Cenários JUSTO vs ENXUTO/ABUNDANTE)
// -----------------------------------------------------------------------------
console.log('1. QUANTIDADE DE BARRIS:');

// Teste 1: Cenário JUSTO (ex: 100 adultos, 4h, somente chope -> 150L = 3 barris exatos)
const dimJusto = calcularDimensionamento(100, 4, 'NAO');
assert(dimJusto.cenarioJusto !== undefined, '100 adultos x 4h gera cenário JUSTO (150L = 3 barris)');

let estadoComJusto = aplicarMudancaEstado(ESTADO_INICIAL, 'qtd_adultos', 100);
estadoComJusto = aplicarMudancaEstado(estadoComJusto, 'duracao_horas', 4);
estadoComJusto = aplicarMudancaEstado(estadoComJusto, 'outras_bebidas_alcoolicas', 'NAO');

assert(
  estadoComJusto.cenario_quantidade === 'JUSTO' && estadoComJusto.barris_total_escolhidos === 3,
  '1. Quando existir cenário JUSTO, ele é pré-selecionado como recomendação principal'
);

// Teste 2: Cenário SEM JUSTO (ex: 80 adultos, 4h, sem outras bebidas -> 80 * 1.5 = 120L.
// Múltiplo inferior: 100L (-20L), múltiplo superior: 150L (+30L). Ambos > 10L, logo NÃO há JUSTO).
const dimSemJusto = calcularDimensionamento(80, 4, 'NAO');
assert(dimSemJusto.cenarioJusto === undefined, '80 adultos x 4h gera apenas ENXUTO (2 barris / 100L) e ABUNDANTE (3 barris / 150L)');
assert(dimSemJusto.cenarioEnxuto !== undefined && dimSemJusto.cenarioAbundante !== undefined, 'ENXUTO e ABUNDANTE estão disponíveis');

let estadoSemJusto = aplicarMudancaEstado(ESTADO_INICIAL, 'qtd_adultos', 80);
estadoSemJusto = aplicarMudancaEstado(estadoSemJusto, 'duracao_horas', 4);
estadoSemJusto = aplicarMudancaEstado(estadoSemJusto, 'outras_bebidas_alcoolicas', 'NAO');

assert(
  estadoSemJusto.barris_total_escolhidos === undefined,
  '2A. Quando existirem somente ENXUTO e ABUNDANTE, barris_total_escolhidos NÃO é escolhido automaticamente'
);
assert(
  estadoSemJusto.cenario_quantidade === undefined,
  '2B. Quando existirem somente ENXUTO e ABUNDANTE, cenario_quantidade NÃO é gravado automaticamente'
);

// Teste 3: Não avança sem escolha (validado logicamente pela ausência de barris_total_escolhidos)
const temEscolhaEfetiva = Boolean(estadoSemJusto.barris_total_escolhidos && estadoSemJusto.barris_total_escolhidos > 0);
assert(!temEscolhaEfetiva, '3. Usuário não tem escolha efetiva registrada antes da interação no caso sem JUSTO');

// Teste 4: Clique em ENXUTO grava escolha
const estadoEscolhidoEnxuto = aplicarMudancaEstado(estadoSemJusto, 'barris_total_escolhidos', dimSemJusto.cenarioEnxuto!.barris);
assert(
  estadoEscolhidoEnxuto.barris_total_escolhidos === 2 && estadoEscolhidoEnxuto.cenario_quantidade === 'ENXUTO',
  '4. Depois da escolha de ENXUTO, o estado registra corretamente 2 barris e cenario ENXUTO'
);

// Teste 5: Clique em ABUNDANTE grava escolha
const estadoEscolhidoAbundante = aplicarMudancaEstado(estadoSemJusto, 'barris_total_escolhidos', dimSemJusto.cenarioAbundante!.barris);
assert(
  estadoEscolhidoAbundante.barris_total_escolhidos === 3 && estadoEscolhidoAbundante.cenario_quantidade === 'ABUNDANTE',
  '5. Depois da escolha de ABUNDANTE, o estado registra corretamente 3 barris e cenario ABUNDANTE'
);

// -----------------------------------------------------------------------------
// GRUPO 2: EQUIPAMENTOS (CHOPEIRA E GÁS NÃO PRESUMIDOS)
// -----------------------------------------------------------------------------
console.log('\n2. EQUIPAMENTOS (CHOPEIRA E GÁS):');

assert(ESTADO_INICIAL.precisa_chopeira === undefined, '6. Estado inicial não contém resposta para chopeira (undefined)');
assert(ESTADO_INICIAL.precisa_gas === undefined, '7. Estado inicial não contém resposta para gás (undefined)');

const botaoChopeiraSimSelecionado = ESTADO_INICIAL.precisa_chopeira === true;
const botaoChopeiraNaoSelecionado = ESTADO_INICIAL.precisa_chopeira === false;
const botaoGasSimSelecionado = ESTADO_INICIAL.precisa_gas === true;
const botaoGasNaoSelecionado = ESTADO_INICIAL.precisa_gas === false;

assert(
  !botaoChopeiraSimSelecionado && !botaoChopeiraNaoSelecionado && !botaoGasSimSelecionado && !botaoGasNaoSelecionado,
  '8. Nenhum botão de Sim ou Não para chopeira ou gás aparece selecionado inicialmente'
);

// Teste 9: Responder chopeira não altera gás
const estadoComChopeira = aplicarMudancaEstado(ESTADO_INICIAL, 'precisa_chopeira', true);
assert(
  estadoComChopeira.precisa_chopeira === true && estadoComChopeira.precisa_gas === undefined,
  '9. Responder chopeira (Sim) não altera gás automaticamente (continua undefined)'
);

// Teste 10: Responder gás não altera chopeira
const estadoComGas = aplicarMudancaEstado(ESTADO_INICIAL, 'precisa_gas', false);
assert(
  estadoComGas.precisa_gas === false && estadoComGas.precisa_chopeira === undefined,
  '10. Responder gás (Não) não altera chopeira automaticamente (continua undefined)'
);

// Teste 11: Avanço só com ambas as respostas
const podeAvancarIncompleto = typeof estadoComChopeira.precisa_chopeira === 'boolean' && typeof estadoComChopeira.precisa_gas === 'boolean';
const estadoCompletoEquip = aplicarMudancaEstado(estadoComChopeira, 'precisa_gas', true);
const podeAvancarCompleto = typeof estadoCompletoEquip.precisa_chopeira === 'boolean' && typeof estadoCompletoEquip.precisa_gas === 'boolean';

assert(!podeAvancarIncompleto, '11A. Não é possível avançar com apenas uma resposta respondida');
assert(podeAvancarCompleto, '11B. Avanço liberado apenas após ambas as respostas efetivas');

// -----------------------------------------------------------------------------
// GRUPO 3: DURAÇÃO DO EVENTO
// -----------------------------------------------------------------------------
console.log('\n3. DURAÇÃO DO EVENTO:');

assert(ESTADO_INICIAL.duracao_horas === undefined, '12. Duração não é considerada confirmada no estado inicial (undefined)');

// Teste 13: Sem interação, não dispara dimensionamento matemático com valor fantasma
const estadoSemDuracao = aplicarMudancaEstado(ESTADO_INICIAL, 'qtd_adultos', 50);
assert(
  estadoSemDuracao.litros_estimados === undefined,
  '13. Se a duração não foi confirmada pelo usuário, o motor não inventa cálculo com base em default'
);

// Teste 14: Após interação, duração é gravada e dimensionamento roda
const estadoComDuracao = aplicarMudancaEstado(estadoSemDuracao, 'duracao_horas', 6);
const estadoComBebida = aplicarMudancaEstado(estadoComDuracao, 'outras_bebidas_alcoolicas', 'SIM');
assert(
  estadoComBebida.duracao_horas === 6 && estadoComBebida.litros_estimados !== undefined,
  '14. Após interação explícita, a duração é persistida e o cálculo de litros é derivado'
);

// -----------------------------------------------------------------------------
// GRUPO 4: CIDADE PADRÃO / BELO HORIZONTE
// -----------------------------------------------------------------------------
console.log('\n4. CIDADE PADRÃO / BELO HORIZONTE:');

const estadoAdapterNovo = criarEstadoInicial();
assert(estadoAdapterNovo.cidade === '', '15A. Estado novo pelo adapter não presume Belo Horizonte');
assert(ESTADO_INICIAL.cidade === '', '15B. ESTADO_INICIAL não presume Belo Horizonte');

assert(
  estadoAdapterNovo.frete.status === 'A_CONFIRMAR' && estadoAdapterNovo.frete.valor === null,
  '16. Estado novo sem cidade não calcula frete fixado de Belo Horizonte (R$ 50)'
);

const paramsUrlCidadeSemModalidade = parsearParametrosUrl('?cidade=Belo+Horizonte');
const resUrlCidadeSemModalidade = importarParametrosURL(paramsUrlCidadeSemModalidade, ESTADO_INICIAL);
assert(
  resUrlCidadeSemModalidade.sucesso &&
    resUrlCidadeSemModalidade.novoEstado.cidade === 'Belo Horizonte' &&
    resUrlCidadeSemModalidade.novoEstado.modalidade_logistica === 'A_DEFINIR' &&
    resUrlCidadeSemModalidade.novoEstado.frete.status === 'A_CONFIRMAR',
  '17A. Deep-link com apenas cidade define a cidade mas preserva modalidade em A_DEFINIR sem calcular frete'
);

const paramsUrlCidadeComEntrega = parsearParametrosUrl('?cidade=Belo+Horizonte&modalidade_logistica=ENTREGA');
const resUrlCidadeComEntrega = importarParametrosURL(paramsUrlCidadeComEntrega, ESTADO_INICIAL);
assert(
  resUrlCidadeComEntrega.sucesso &&
    resUrlCidadeComEntrega.novoEstado.cidade === 'Belo Horizonte' &&
    resUrlCidadeComEntrega.novoEstado.modalidade_logistica === 'ENTREGA' &&
    resUrlCidadeComEntrega.novoEstado.frete.status === 'FIXADO' &&
    resUrlCidadeComEntrega.novoEstado.frete.valor === 50,
  '17B. Deep-link com cidade e modalidade ENTREGA calcula frete correspondente de R$ 50'
);

// -----------------------------------------------------------------------------
// GRUPO 5: FORMA DE PAGAMENTO
// -----------------------------------------------------------------------------
console.log('\n5. FORMA DE PAGAMENTO:');

assert(ESTADO_INICIAL.forma_pagamento === 'A_DEFINIR', '18. Estado inicial nasce em A_DEFINIR');

const orcamentoBase = calcularOrcamento({
  barrisTotal: 2,
  mix: { pilsen: 2, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  frete: { status: 'FIXADO', valor: 50, faixaNome: 'Belo Horizonte' },
  formaPagamento: 'PIX',
  parcelasCartao: 1,
  houveBarganha: false,
});

assert(
  ESTADO_INICIAL.forma_pagamento === 'A_DEFINIR',
  '19. Calcular orçamento de pré-visualização não sobrescreve forma_pagamento para PIX'
);

// Teste 20: Clicar em forma de pagamento grava somente ela
const estadoPix = aplicarMudancaEstado(ESTADO_INICIAL, 'forma_pagamento', 'PIX');
assert(estadoPix.forma_pagamento === 'PIX', '20A. Selecionar PIX grava PIX');

const estadoCartao = aplicarMudancaEstado(ESTADO_INICIAL, 'forma_pagamento', 'CARTAO');
assert(estadoCartao.forma_pagamento === 'CARTAO', '20B. Selecionar CARTAO grava CARTAO');
assert(
  estadoCartao.parcelas_cartao === undefined,
  '20C. Selecionar CARTAO sozinho mantém parcelas_cartao indefinido (não assume 1x)'
);

// Teste 21: Recalcular condições financeiras em cartão (ex: 6x)
let estadoCartao6x = aplicarMudancaEstado(estadoCartao, 'barris_total_escolhidos', 2);
estadoCartao6x = aplicarMudancaEstado(estadoCartao6x, 'mix', { pilsen: 2, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 });
estadoCartao6x = aplicarMudancaEstado(estadoCartao6x, 'frete', { status: 'FIXADO', valor: 50, faixaNome: 'Belo Horizonte' });

assert(
  estadoCartao6x.orcamento?.parcelasCartao === undefined &&
    estadoCartao6x.orcamento?.totalGeral === null &&
    estadoCartao6x.orcamento?.totalGeralFormatado === 'Selecione as parcelas',
  '20D. Cartão sem seleção explícita de parcelas não presume 1x'
);

const estadoCartaoParcelado = aplicarMudancaEstado(estadoCartao6x, 'parcelas_cartao', 6);

assert(
  estadoCartaoParcelado.orcamento?.multiplicadorCartao !== undefined &&
  estadoCartaoParcelado.orcamento.multiplicadorCartao > 1,
  '21. Condições financeiras dependentes (acréscimo de parcelamento cartão) são recalculadas com exatidão'
);

// 21A: 1x usa multiplicador 1.0439 e NÃO é tratado como sem acréscimo
const estadoCartao1x = aplicarMudancaEstado(estadoCartao6x, 'parcelas_cartao', 1);
assert(
  estadoCartao1x.orcamento?.multiplicadorCartao === 1.0439 &&
  (estadoCartao1x.orcamento?.totalProdutosLiquido || 0) > (estadoCartao1x.orcamento?.totalProdutosBruto || 0),
  '21A. 1x usa multiplicador 1.0439 e não é tratado como sem acréscimo'
);

// 21B: 2x usa multiplicador 1.0650
const estadoCartao2x = aplicarMudancaEstado(estadoCartao6x, 'parcelas_cartao', 2);
assert(
  estadoCartao2x.orcamento?.multiplicadorCartao === 1.065,
  '21B. 2x usa multiplicador 1.0650'
);

// 21C: 6x usa multiplicador 1.1076
assert(
  estadoCartaoParcelado.orcamento?.multiplicadorCartao === 1.1076,
  '21C. 6x usa multiplicador 1.1076'
);

// 21D: 12x usa multiplicador 1.2000
const estadoCartao12x = aplicarMudancaEstado(estadoCartao6x, 'parcelas_cartao', 12);
assert(
  estadoCartao12x.orcamento?.multiplicadorCartao === 1.2,
  '21D. 12x usa multiplicador 1.2000'
);

// 21E: Valor da parcela = total no cartão / num parcelas, com frete integrando a base financeira
const orc12x = estadoCartao12x.orcamento;
assert(
  orc12x !== undefined &&
  orc12x.valorParcelaCartao === Number(((orc12x.totalGeral || 0) / 12).toFixed(2)) &&
  orc12x.frete.valor === 50 &&
  orc12x.totalGeral === Number(((orc12x.totalProdutosBruto + 50) * 1.2).toFixed(2)),
  '21E. Valor da parcela = total geral no cartão / parcelas; frete conhecido integra a base multiplicada'
);

// 21F: Troca de parcelas atualiza os valores dinamicamente
assert(
  estadoCartao1x.orcamento?.valorParcelaCartao !== estadoCartaoParcelado.orcamento?.valorParcelaCartao &&
  (estadoCartao1x.orcamento?.totalGeral || 0) < (estadoCartaoParcelado.orcamento?.totalGeral || 0),
  '21F. Troca de número de parcelas atualiza corretamente os valores exibidos'
);

// 21G: Frete A_CONFIRMAR não bloqueia orçamento e demonstra parcelas conhecidas sem fechar total geral
const estadoFreteAConfirmar = aplicarMudancaEstado(estadoCartaoParcelado, 'frete', {
  status: 'A_CONFIRMAR',
  valor: null,
  faixaNome: 'Sob consulta',
});
assert(
  estadoFreteAConfirmar.orcamento !== undefined &&
  estadoFreteAConfirmar.orcamento.invariantesValidos === true &&
  estadoFreteAConfirmar.orcamento.totalGeral === null &&
  estadoFreteAConfirmar.orcamento.totalGeralFormatado.includes('Frete a confirmar') &&
  estadoFreteAConfirmar.orcamento.valorParcelaCartao !== undefined,
  '21G. Frete A_CONFIRMAR não bloqueia orçamento: exibe valores conhecidos e totalGeral null'
);

// 21H: Confirmação de frete reconstrói base financeira completa e exige novo aceite se já revisado
let estadoConfirmacaoFrete: CalculatorState = {
  ...estadoFreteAConfirmar,
  parcelas_cartao: 1,
  revisao_pre_orcamento_confirmada: true,
  aceite_orcamento: 'SIM',
};
estadoConfirmacaoFrete = aplicarMudancaEstado(estadoConfirmacaoFrete, 'frete', {
  status: 'FIXADO',
  valor: 60,
  faixaNome: 'RMBH Confirmado',
});
assert(
  estadoConfirmacaoFrete.orcamento?.totalGeral !== null &&
  estadoConfirmacaoFrete.orcamento?.totalGeral === Number(((estadoConfirmacaoFrete.orcamento!.totalProdutosBruto + 60) * 1.0439).toFixed(2)) &&
  estadoConfirmacaoFrete.aceite_orcamento === 'PENDENTE',
  '21H. Confirmação do frete recalcula base completa (produtos + frete) e redefine aceite como PENDENTE'
);

// -----------------------------------------------------------------------------
// GRUPO 6: MODALIDADE LOGÍSTICA (NÃO PRESUMIR ENTREGA)
// -----------------------------------------------------------------------------
console.log('\n6. MODALIDADE LOGÍSTICA:');

assert(
  ESTADO_INICIAL.modalidade_logistica === 'A_DEFINIR',
  '22. Estado inicial define modalidade_logistica como A_DEFINIR'
);

const estadoComEntrega = aplicarMudancaEstado(ESTADO_INICIAL, 'modalidade_logistica', 'ENTREGA');
assert(
  estadoComEntrega.modalidade_logistica === 'ENTREGA',
  '23A. Seleção explícita de Entrega grava modalidade ENTREGA'
);

const estadoComRetirada = aplicarMudancaEstado(ESTADO_INICIAL, 'modalidade_logistica', 'RETIRADA_FABRICA');
assert(
  estadoComRetirada.modalidade_logistica === 'RETIRADA_FABRICA' &&
    estadoComRetirada.frete.status === 'GRATIS' &&
    estadoComRetirada.frete.valor === 0,
  '23B. Seleção explícita de Retirada grava RETIRADA_FABRICA com frete grátis'
);

// -----------------------------------------------------------------------------
// GRUPO 7: GATES DO DEEP-LINK / URL ADAPTER
// -----------------------------------------------------------------------------
console.log('\n7. GATES DO DEEP-LINK / URL ADAPTER:');

// Cenário A0: Evento faltando horário de início -> Deve permanecer na Etapa 1 (Evento)
const urlEventoSemHora = parsearParametrosUrl('?src=iara&data_evento=2026-11-20&qtd_adultos=80&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte');
const resEventoSemHora = importarParametrosURL(urlEventoSemHora, ESTADO_INICIAL);
assert(
  resEventoSemHora.sucesso && resEventoSemHora.primeiraEtapaPendente === 1,
  '23C. Deep-link com evento sem horário de início permanece na Etapa 1 (campo obrigatório)'
);

// Cenário A: Evento completo (incluindo horário de início), mas barris não escolhidos -> Etapa 2
const urlEvento = parsearParametrosUrl('?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=80&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte');
const resEvento = importarParametrosURL(urlEvento, ESTADO_INICIAL);
assert(
  resEvento.sucesso && resEvento.primeiraEtapaPendente === 2,
  '24. Deep-link com dados do evento direciona para Etapa 2 (Dimensionamento)'
);

// Cenário B: Evento + Barris + Mix completos, mas SEM chopeira e gás -> Etapa 4 (Equipamentos)
const urlSemEquip = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3'
);
const resSemEquip = importarParametrosURL(urlSemEquip, ESTADO_INICIAL);
assert(
  resSemEquip.sucesso && resSemEquip.primeiraEtapaPendente === 4,
  '25. Deep-link com evento, barris e mix completos MAS sem chopeira/gás direciona para Etapa 4 (Equipamentos)'
);

// Cenário C: Evento + Barris + Mix + Endereço na URL, mas SEM chopeira/gás -> Deve travar na Etapa 4!
const urlComEnderecoMasSemEquip = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&logradouro=Rua+dos+Inconfidentes&numero=1000&bairro=Savassi'
);
const resComEnderecoMasSemEquip = importarParametrosURL(urlComEnderecoMasSemEquip, ESTADO_INICIAL);
assert(
  resComEnderecoMasSemEquip.sucesso && resComEnderecoMasSemEquip.primeiraEtapaPendente === 4,
  '26. Mesmo com endereço presente na URL, a ausência de resposta para chopeira ou gás trava na Etapa 4'
);

// Cenário D: Equipamentos preenchidos, mas modalidade_logistica indefinida (A_DEFINIR) -> Etapa 5 (Logística)
const urlComEquipSemModalidade = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM'
);
const resComEquipSemModalidade = importarParametrosURL(urlComEquipSemModalidade, ESTADO_INICIAL);
assert(
  resComEquipSemModalidade.sucesso && resComEquipSemModalidade.primeiraEtapaPendente === 5,
  '27. Com evento, barris, mix e equipamentos definidos, mas modalidade logística A_DEFINIR, trava na Etapa 5'
);

// Cenário E: Modalidade ENTREGA informada, mas faltam dados de endereço -> Etapa 5 (Logística)
const urlComEntregaSemEndereco = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=ENTREGA'
);
const resComEntregaSemEndereco = importarParametrosURL(urlComEntregaSemEndereco, ESTADO_INICIAL);
assert(
  resComEntregaSemEndereco.sucesso && resComEntregaSemEndereco.primeiraEtapaPendente === 5,
  '28. Com modalidade ENTREGA mas sem logradouro/número/bairro, trava na Etapa 5'
);

// Cenário F1: Entrega com endereço preenchido mas SEM data/hora -> Permanece na Etapa 5 (Logística)
const urlEntregaSemDataHora = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=ENTREGA&logradouro=Rua+dos+Inconfidentes&numero=1000&bairro=Savassi'
);
const resEntregaSemDataHora = importarParametrosURL(urlEntregaSemDataHora, ESTADO_INICIAL);
assert(
  resEntregaSemDataHora.sucesso && resEntregaSemDataHora.primeiraEtapaPendente === 5,
  '29A. Entrega com endereço mas sem data/hora desejadas permanece na Etapa 5 (Logística)'
);

// Cenário F2: Entrega completa com endereço, data de entrega válida e horário comercial válido -> Avança para Etapa 6 (Revisão)
const urlCompletaEntrega = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=ENTREGA&logradouro=Rua+dos+Inconfidentes&numero=1000&bairro=Savassi&data_entrega=2026-11-19&hora_entrega=14:00'
);
const resCompletaEntrega = importarParametrosURL(urlCompletaEntrega, ESTADO_INICIAL);
assert(
  resCompletaEntrega.sucesso && resCompletaEntrega.primeiraEtapaPendente === 6,
  '29B. Com todas as etapas satisfeitas (inclusive endereço, data_entrega e hora_entrega válidas), direciona para Etapa 6 (Revisão)'
);

// Cenário G1: Retirada na fábrica com data preenchida mas HORA AUSENTE -> Permanece na Etapa 5 (Logística)
const urlRetiradaSemHora = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-19'
);
const resRetiradaSemHora = importarParametrosURL(urlRetiradaSemHora, ESTADO_INICIAL);
assert(
  resRetiradaSemHora.sucesso && resRetiradaSemHora.primeiraEtapaPendente === 5,
  '30A. Retirada na fábrica com data preenchida mas SEM HORA permanece na Etapa 5 (Logística)'
);

// Cenário G2: Retirada na fábrica com hora preenchida mas DATA AUSENTE -> Permanece na Etapa 5 (Logística)
const urlRetiradaSemData = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&hora_retirada=14:00'
);
const resRetiradaSemData = importarParametrosURL(urlRetiradaSemData, ESTADO_INICIAL);
assert(
  resRetiradaSemData.sucesso && resRetiradaSemData.primeiraEtapaPendente === 5,
  '30B. Retirada na fábrica com hora preenchida mas SEM DATA permanece na Etapa 5 (Logística)'
);

// Cenário G3: Retirada na fábrica com data e hora válidas (D-1) -> Avança para Etapa 6 (Revisão)
const urlCompletaRetirada = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-19&hora_retirada=14:00'
);
const resCompletaRetirada = importarParametrosURL(urlCompletaRetirada, ESTADO_INICIAL);
assert(
  resCompletaRetirada.sucesso && resCompletaRetirada.primeiraEtapaPendente === 6,
  '30C. Com todas as etapas satisfeitas (inclusive retirada na fábrica com data e hora válidas), avança para Etapa 6 (Revisão)'
);

// Cenário G4: Retirada no próprio dia do evento é permitida se horário comercial for válido -> Avança para Etapa 6
const urlRetiradaMesmoDia = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-20&hora_retirada=14:00'
);
const resRetiradaMesmoDia = importarParametrosURL(urlRetiradaMesmoDia, ESTADO_INICIAL);
assert(
  resRetiradaMesmoDia.sucesso && resRetiradaMesmoDia.primeiraEtapaPendente === 6,
  '30D. Retirada no próprio dia do evento com horário válido é PERMITIDA e avança para Etapa 6'
);

// Cenário G5: Retirada com data posterior ao evento é inválida -> Permanece na Etapa 5 (Logística)
const urlRetiradaDataAposEvento = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-21&hora_retirada=14:00'
);
const resRetiradaDataAposEvento = importarParametrosURL(urlRetiradaDataAposEvento, ESTADO_INICIAL);
assert(
  resRetiradaDataAposEvento.sucesso && resRetiradaDataAposEvento.primeiraEtapaPendente === 5,
  '30E. Retirada com data posterior ao evento é INVÁLIDA e permanece na Etapa 5 (Logística)'
);

// Cenário G6: Horário fora da janela comercial (10h às 17h) é inválido -> Permanece na Etapa 5 (Logística)
const urlRetiradaHoraForaJanela = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-19&hora_retirada=09:00'
);
const resRetiradaHoraForaJanela = importarParametrosURL(urlRetiradaHoraForaJanela, ESTADO_INICIAL);
assert(
  resRetiradaHoraForaJanela.sucesso && resRetiradaHoraForaJanela.primeiraEtapaPendente === 5,
  '30F. Horário antes das 10:00 (fora da janela comercial) é INVÁLIDO e permanece na Etapa 5'
);

// Cenário G7: No dia do evento, horário logístico posterior ao início do evento é inválido -> Permanece na Etapa 5
const urlRetiradaAposInicioEvento = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-20&hora_retirada=15:00'
);
const resRetiradaAposInicioEvento = importarParametrosURL(urlRetiradaAposInicioEvento, ESTADO_INICIAL);
assert(
  resRetiradaAposInicioEvento.sucesso && resRetiradaAposInicioEvento.primeiraEtapaPendente === 5,
  '30G. No dia do evento, horário posterior ao início do evento (15:00 > 14:00) permanece na Etapa 5'
);

// -----------------------------------------------------------------------------
// GRUPO 8: COMUNICAÇÃO HANDOFF WHATSAPP & FRETE A_CONFIRMAR VS CONHECIDO
// -----------------------------------------------------------------------------
console.log('8. HANDOFF WHATSAPP & FRETE A_CONFIRMAR:');

// Teste 31A: Frete A_CONFIRMAR + Cartão (3x)
// Não deve exibir parcela numérica parcial calculada sobre produtos como se fosse definitiva
const estado31A: CalculatorState = {
  ...ESTADO_INICIAL,
  data_evento: '2026-11-20',
  horario_inicio_evento: '14:00',
  qtd_adultos: 100,
  duracao_horas: 4,
  barris_total_escolhidos: 3,
  mix: { pilsen: 3, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  forma_pagamento: 'CARTAO',
  parcelas_cartao: 3,
  modalidade_logistica: 'ENTREGA',
  cidade: 'Nova Lima',
  endereco: {
    cidade: 'Nova Lima',
    logradouro: 'Rua Principal',
    numero: '100',
    bairro: 'Alphaville',
    complemento: 'SEM_COMPLEMENTO',
  },
  frete: { status: 'A_CONFIRMAR', valor: null, faixaNome: 'Fora de Área' },
};
estado31A.orcamento = calcularOrcamento({
  barrisTotal: 3,
  mix: estado31A.mix,
  frete: estado31A.frete,
  formaPagamento: 'CARTAO',
  parcelasCartao: 3,
  houveBarganha: false,
});
const msg31A = gerarTextoMensagemWhatsApp(estado31A, 'final', 8, 'Contato');
assert(
  !msg31A.includes('3x de R$') &&
    !msg31A.includes('699,08') &&
    msg31A.includes('total e parcelas serão recalculados sobre produtos + frete após a confirmação do frete'),
  '31A. Frete A_CONFIRMAR com cartão NÃO exibe valor parcial de parcelas como definitivo no WhatsApp'
);

// Teste 31B: Frete A_CONFIRMAR + Barganha/Cupom (Pix com desconto de 5%)
// Não deve exibir total líquido parcial como definitivo
const estado31B: CalculatorState = {
  ...estado31A,
  forma_pagamento: 'PIX',
  parcelas_cartao: 1,
  houve_barganha: true,
};
estado31B.orcamento = calcularOrcamento({
  barrisTotal: 3,
  mix: estado31B.mix,
  frete: estado31B.frete,
  formaPagamento: 'PIX',
  houveBarganha: true,
});
const msg31B = gerarTextoMensagemWhatsApp(estado31B, 'final', 8, 'Contato');
assert(
  !msg31B.includes('R$ 1.852,50') &&
    msg31B.includes('desconto final será aplicado sobre o total do pedido (produtos + frete) após a confirmação do frete'),
  '31B. Frete A_CONFIRMAR com barganha/Pix NÃO exibe total líquido parcial e avisa reaplicação dos 5%'
);

// Teste 31C: Frete conhecido + Cartão (3x) -> Exibe normalmente parcela e total final
const estado31C: CalculatorState = {
  ...estado31A,
  cidade: 'Belo Horizonte',
  frete: { status: 'FIXADO', valor: 50, faixaNome: 'Belo Horizonte' },
};
estado31C.orcamento = calcularOrcamento({
  barrisTotal: 3,
  mix: estado31C.mix,
  frete: estado31C.frete,
  formaPagamento: 'CARTAO',
  parcelasCartao: 3,
  houveBarganha: false,
});
const msg31C = gerarTextoMensagemWhatsApp(estado31C, 'final', 8, 'Contato');
assert(
  msg31C.includes('3x de') && msg31C.includes('760,02') && msg31C.includes('2.280,06'),
  '31C. Frete conhecido com cartão exibe quantidade de parcelas, valor da parcela e total final corretos'
);

// Teste 31D: Frete conhecido + Desconto Pix (5%) -> Exibe normalmente desconto e total final
const estado31D: CalculatorState = {
  ...estado31C,
  forma_pagamento: 'PIX',
  houve_barganha: true,
};
estado31D.orcamento = calcularOrcamento({
  barrisTotal: 3,
  mix: estado31D.mix,
  frete: estado31D.frete,
  formaPagamento: 'PIX',
  houveBarganha: true,
});
const msg31D = gerarTextoMensagemWhatsApp(estado31D, 'final', 8, 'Contato');
assert(
  msg31D.includes('2.014,00') && msg31D.includes('(com 5% off)'),
  '31D. Frete conhecido com desconto exibe desconto de 5% e total final calculados sobre produtos + frete'
);

// Teste 31E: Confirmação posterior do frete recalcula valores sobre base completa
// Estado 31A tinha frete A_CONFIRMAR. Equipe confirma frete para R$ 75.
const estado31E = aplicarMudancaEstado(estado31A, 'frete', {
  status: 'FIXADO',
  valor: 75,
  faixaNome: 'Grande BH Externa',
});
const msg31E = gerarTextoMensagemWhatsApp(estado31E, 'final', 8, 'Contato');
assert(
  msg31E.includes('3x de') &&
    msg31E.includes('768,98') &&
    msg31E.includes('2.306,95') &&
    !msg31E.includes('a confirmar'),
  '31E. Confirmação posterior do frete recalcula e exibe parcelas e total final definitivos no WhatsApp'
);

// -----------------------------------------------------------------------------
// GRUPO 9: IDENTIFICAÇÃO PRÉ-ORÇAMENTO, GATES E FECHAMENTO DIRETO
// -----------------------------------------------------------------------------
console.log('9. IDENTIFICAÇÃO PRÉ-ORÇAMENTO & FECHAMENTO DIRETO:');

// 32A: Nome vazio ou insuficiente bloqueia avanço para o orçamento
const vNomeVazio = validarGateIdentificacao({ nome_completo: '', telefone_responsavel: '31999999999' });
const vNomeCurto = validarGateIdentificacao({ nome_completo: 'Lu', telefone_responsavel: '31999999999' });
assert(!vNomeVazio.valido && !vNomeCurto.valido, '32A. Nome vazio ou menor que 3 caracteres bloqueia geração do orçamento');

// 32B: Telefone vazio ou inválido bloqueia avanço para o orçamento
const vTelVazio = validarGateIdentificacao({ nome_completo: 'Lucas Mendes', telefone_responsavel: '' });
const vTelIncompleto = validarGateIdentificacao({ nome_completo: 'Lucas Mendes', telefone_responsavel: '99999999' }); // Sem DDD
assert(!vTelVazio.valido && !vTelIncompleto.valido, '32B. Telefone vazio ou sem DDD bloqueia geração do orçamento');

// 32C: E-mail vazio NÃO bloqueia o avanço (opcional)
const vEmailVazio = validarGateIdentificacao({ nome_completo: 'Lucas Mendes', telefone_responsavel: '31999999999', email: '' });
const vSemEmail = validarGateIdentificacao({ nome_completo: 'Lucas Mendes', telefone_responsavel: '31999999999' });
assert(vEmailVazio.valido && vSemEmail.valido, '32C. E-mail vazio ou omitido NÃO bloqueia avanço para orçamento (opcional)');

// 32D: E-mail informado e inválido bloqueia solicitando correção
const vEmailInvalido = validarGateIdentificacao({ nome_completo: 'Lucas Mendes', telefone_responsavel: '31999999999', email: 'lucas-sem-arroba' });
assert(!vEmailInvalido.valido && vEmailInvalido.erro === 'E-mail inválido', '32D. E-mail informado e com formato inválido não é aceito');

// 32E: Identificação completa permite avançar para Etapa 8 (Orçamento)
const vCompleto = validarGateIdentificacao({ nome_completo: 'Lucas Mendes', telefone_responsavel: '31999999999', email: 'lucas@exemplo.com.br' });
assert(vCompleto.valido, '32E. Identificação com nome e telefone válidos permite avançar para orçamento');

// 32F: Orçamento não seleciona forma de pagamento automaticamente (nasce em A_DEFINIR)
assert(ESTADO_INICIAL.forma_pagamento === 'A_DEFINIR', '32F. Orçamento não seleciona forma de pagamento automaticamente (A_DEFINIR)');

// 32G: Cartão exige quantidade de parcelas válida (1 a 12)
let estadoCartao32 = aplicarMudancaEstado(ESTADO_INICIAL, 'forma_pagamento', 'CARTAO');
estadoCartao32 = aplicarMudancaEstado(estadoCartao32, 'parcelas_cartao', 3);
assert(
  estadoCartao32.forma_pagamento === 'CARTAO' &&
    typeof estadoCartao32.parcelas_cartao === 'number' &&
    estadoCartao32.parcelas_cartao >= 1 &&
    estadoCartao32.parcelas_cartao <= 12,
  '32G. Cartão exige e armazena quantidade de parcelas definida entre 1 e 12'
);

// 32H: Mudança da forma de pagamento recalcula o valor antes da confirmação
let estadoRecalculo: CalculatorState = {
  ...ESTADO_INICIAL,
  data_evento: '2026-11-20',
  horario_inicio_evento: '14:00',
  qtd_adultos: 100,
  duracao_horas: 4,
  barris_total_escolhidos: 3,
  mix: { pilsen: 3, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  cidade: 'Belo Horizonte',
  frete: { status: 'FIXADO' as const, valor: 50, faixaNome: 'Belo Horizonte' },
};
// 3 barris Pilsen (2070) + frete 50 = 2120 base. PIX à vista = 2120.
estadoRecalculo = aplicarMudancaEstado(estadoRecalculo, 'forma_pagamento', 'PIX');
const totalPix = estadoRecalculo.orcamento?.totalGeral;
// Troca para CARTAO 3x (mult 1.0755) -> 2120 * 1.0755 = 2280.06
estadoRecalculo = aplicarMudancaEstado(estadoRecalculo, 'forma_pagamento', 'CARTAO');
estadoRecalculo = aplicarMudancaEstado(estadoRecalculo, 'parcelas_cartao', 3);
const totalCartao = estadoRecalculo.orcamento?.totalGeral;
assert(
  totalPix === 2120 && totalCartao === 2280.06,
  '32H. Mudança de forma de pagamento recalcula o total imediatamente antes da confirmação'
);

// 32I: Confirmar pedido representa aceite explícito da condição vigente
const estadoAceite = aplicarMudancaEstado(estadoRecalculo, 'aceite_orcamento', 'SIM');
assert(
  estadoAceite.aceite_orcamento === 'SIM',
  '32I. Confirmar pedido registra formalmente o aceite da condição comercial vigente'
);

// 32J: Confirmação válida gera o handoff/WhatsApp com dados completos (inclusive lead capturado antes)
estadoAceite.contato = {
  nome_completo: 'Lucas Mendes',
  telefone_responsavel: '31 99999-9999',
  email: 'lucas@exemplo.com.br',
};
const msgFinal = gerarTextoMensagemWhatsApp(estadoAceite, 'final', 8, 'Cotação & Pagamento');
assert(
  msgFinal.includes('Lucas Mendes') &&
    msgFinal.includes('31 99999-9999') &&
    msgFinal.includes('lucas@exemplo.com.br') &&
    msgFinal.includes('Cartão (3x de') &&
    msgFinal.includes('2.280,06') &&
    msgFinal.includes('Confirmei minha cotação') &&
    msgFinal.includes('Cotação Confirmada pelo Cliente'),
  '32J. Confirmação do pedido gera o handoff wa.me completo com dados do lead, parcelas e aceite'
);

// 32K: Dados do lead já coletados na Etapa 7 são preservados e não são solicitados novamente
assert(
  estadoAceite.contato.nome_completo === 'Lucas Mendes' &&
    estadoAceite.contato.telefone_responsavel === '31 99999-9999',
  '32K. Dados do lead são preservados no estado e não são solicitados novamente'
);

// 32L: Alteração financeira não apaga os dados do lead
let estadoMudancaFinanceira = aplicarMudancaEstado(estadoAceite, 'forma_pagamento', 'PIX');
estadoMudancaFinanceira = aplicarMudancaEstado(estadoMudancaFinanceira, 'houve_barganha', true);
assert(
  estadoMudancaFinanceira.contato.nome_completo === 'Lucas Mendes' &&
    estadoMudancaFinanceira.contato.telefone_responsavel === '31 99999-9999' &&
    estadoMudancaFinanceira.contato.email === 'lucas@exemplo.com.br',
  '32L. Alteração de forma de pagamento e cupom NÃO apaga ou reseta os dados do lead'
);

// 32M: Deep-link incompleto retorna à primeira etapa realmente pendente
// Sem revisão confirmada -> Etapa 6
const urlAposLogistica = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-20&hora_retirada=12:00'
);
const resAposLogistica = importarParametrosURL(urlAposLogistica, ESTADO_INICIAL);
assert(resAposLogistica.primeiraEtapaPendente === 6, '32M1. Sem conferência pré-orçamento confirmada, deep-link direciona para Etapa 6 (Revisão)');

// 32M2: Parâmetro revisao_pre_orcamento_confirmada na URL é ignorado e não ultrapassa Etapa 6
const urlComRevisaoSemContato = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-20&hora_retirada=12:00&revisao_pre_orcamento_confirmada=true'
);
const resComRevisaoSemContato = importarParametrosURL(urlComRevisaoSemContato, ESTADO_INICIAL);
assert(
  resComRevisaoSemContato.novoEstado.revisao_pre_orcamento_confirmada === false &&
    resComRevisaoSemContato.primeiraEtapaPendente === 6,
  '32M2. URL não pode fabricar revisão confirmada e deep-link para na Etapa 6 (Revisão)'
);

// 32M3: Mesmo com contato completo na URL, sem revisão confirmada pelo usuário para na Etapa 6
const urlComContatoCompleto = parsearParametrosUrl(
  '?src=iara&data_evento=2026-11-20&horario_inicio_evento=14:00&qtd_adultos=100&duracao_horas=4&outras_bebidas_alcoolicas=NAO&cidade=Belo+Horizonte&barris_total_escolhidos=3&barris_pilsen=3&precisa_chopeira=SIM&precisa_gas=SIM&modalidade_logistica=RETIRADA_FABRICA&data_retirada=2026-11-20&hora_retirada=12:00&revisao_pre_orcamento_confirmada=true&nome=Lucas+Mendes&telefone=31999999999'
);
const resComContatoCompleto = importarParametrosURL(urlComContatoCompleto, ESTADO_INICIAL);
assert(
  resComContatoCompleto.novoEstado.revisao_pre_orcamento_confirmada === false &&
    resComContatoCompleto.primeiraEtapaPendente === 6,
  '32M3. Deep-link nunca ultrapassa a Etapa 6 e exige ato explícito de revisão'
);

// Validação dos gates pós-revisão confirmada legitimamente pelo usuário na UI:
const estadoComRevisaoConfirmadaUI: CalculatorState = {
  ...resComRevisaoSemContato.novoEstado,
  revisao_pre_orcamento_confirmada: true,
};
assert(
  determinarEtapaPorGates(estadoComRevisaoConfirmadaUI) === 7,
  '32M4. Com conferência de revisão confirmada pelo usuário e sem contato, gates liberam avanço para Etapa 7'
);

const estadoComRevisaoEContatoUI: CalculatorState = {
  ...resComContatoCompleto.novoEstado,
  revisao_pre_orcamento_confirmada: true,
};
assert(
  determinarEtapaPorGates(estadoComRevisaoEContatoUI) === 8,
  '32M5. Com revisão confirmada e contato completo, gates liberam avanço para Etapa 8'
);

// 32N: Nenhuma regra antiga continua exigindo e-mail para conclusão da identificação
const vSemEmailParaOrcamento = validarGateIdentificacao({
  nome_completo: 'Mariana Silva',
  telefone_responsavel: '31988887777',
});
assert(vSemEmailParaOrcamento.valido, '32N. Nenhuma regra exige e-mail para avançar ao orçamento e concluir pedido');

// -----------------------------------------------------------------------------
// GRUPO 10: ENDEREÇO OFICIAL DA FÁBRICA & NORMALIZAÇÃO FACTUAL
// -----------------------------------------------------------------------------
console.log('\n10. ENDEREÇO OFICIAL DA FÁBRICA & NORMALIZAÇÃO:');

const estadoRetiradaFabrica: CalculatorState = {
  ...ESTADO_INICIAL,
  data_evento: '2026-11-20',
  horario_inicio_evento: '14:00',
  qtd_adultos: 50,
  duracao_horas: 4,
  barris_total_escolhidos: 2,
  mix: { pilsen: 2, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  modalidade_logistica: 'RETIRADA_FABRICA',
  data_retirada: '2026-11-20',
  hora_retirada: '11:00',
  forma_pagamento: 'PIX',
  aceite_orcamento: 'SIM',
  contato: { nome_completo: 'Mariana', telefone_responsavel: '31 99999-0000' },
};
const msgRetirada = gerarTextoMensagemWhatsApp(estadoRetiradaFabrica, 'final', 8, 'Cotação & Pagamento');
assert(
  msgRetirada.includes('R. Rainha Elizabeth, 639 – Jardim Canadá, Nova Lima – MG, CEP 34007-790'),
  '33A. Mensagem de retirada na fábrica referencia o endereço oficial completo (Rainha Elizabeth, 639, Jardim Canadá, Nova Lima, CEP 34007-790)'
);
assert(
  !msgRetirada.includes('Montreal') && !msgRetirada.includes('Japão'),
  '33B. Mensagem de retirada não possui referências residuais a Montreal ou Jardim Japão'
);
assert(
  msgRetirada.includes('Cotação Confirmada pelo Cliente') &&
    !msgRetirada.includes('Pedido Finalizado no App') &&
    !msgRetirada.includes('confirmar a reserva dos meus barris'),
  '33C. Handoff WhatsApp utiliza semântica de cotação confirmada pelo cliente sem afirmar reservas de estoque/barris automáticas'
);

// -----------------------------------------------------------------------------
// GRUPO 11: RODADA 2 — DURAÇÃO DO EVENTO (HORAS INTEIRAS & EVENTO LONGO)
// -----------------------------------------------------------------------------
console.log('\n11. DURAÇÃO DO EVENTO & CASOS ESPECIAIS (>12H):');

// 34A: Duração rejeita valores fracionados
let rejeitouFracionado = false;
try {
  calcularDimensionamento(50, 4.5, 'NAO');
} catch {
  rejeitouFracionado = true;
}
assert(rejeitouFracionado, '34A. Motor rejeita durações fracionadas (ex: 4.5h), aceitando apenas inteiros de 1 a 12');

// 34B: Evento com mais de 12 horas ou múltiplos dias sinaliza estado e não extrapola além de 12h
const estadoEventoEspecial = aplicarMudancaEstado(ESTADO_INICIAL, 'evento_longo_ou_multiplos_dias', true);
assert(
  estadoEventoEspecial.evento_longo_ou_multiplos_dias === true,
  '34B. Sinalização de evento longo ou múltiplos dias registrada no estado'
);

const estadoComEspecialEContato: CalculatorState = {
  ...estadoEventoEspecial,
  data_evento: '2026-11-20',
  horario_inicio_evento: '12:00',
  qtd_adultos: 100,
  outras_bebidas_alcoolicas: 'NAO',
  duracao_horas: undefined,
  barris_total_escolhidos: undefined,
  mix: { pilsen: 0, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  forma_pagamento: 'PIX',
  contato: { nome_completo: 'Carlos Teste', telefone_responsavel: '31 98888-7777' },
};
const msgWhatsAppEspecial = gerarTextoMensagemWhatsApp(estadoComEspecialEContato, 'preventivo', 2, 'Dimensionamento');
assert(
  msgWhatsAppEspecial.includes('Evento com mais de 12h ou múltiplos dias (análise comercial)'),
  '34C. Mensagem do WhatsApp reflete condição de evento especial (> 12h ou múltiplos dias)'
);

// -----------------------------------------------------------------------------
// GRUPO 12: RODADA 3 — EQUIPAMENTOS (SEM CEIL E SEMÂNTICA DE SOLICITAÇÃO)
// -----------------------------------------------------------------------------
console.log('\n12. EQUIPAMENTOS (SEM RECOMENDAÇÃO AUTOMÁTICA & SEMÂNTICA):');

// 35A: Não gera cálculo automático de ceil(barris / 2)
const estadoBarrisEquip = aplicarMudancaEstado(ESTADO_INICIAL, 'barris_total_escolhidos', 5);
const estadoComChopeiraSemCeil = aplicarMudancaEstado(estadoBarrisEquip, 'precisa_chopeira', true);
assert(
  (estadoComChopeiraSemCeil as any).qtd_chopeiras_referencia === undefined,
  '35A. Não sugere e não calcula quantidade de referência de chopeiras do tipo ceil(barris/2)'
);

// 35B: Semântica no WhatsApp de solicitação e disponibilidade a confirmar (não garantia de inclusão)
const estadoEquipWhatsApp: CalculatorState = {
  ...estadoComChopeiraSemCeil,
  precisa_gas: true,
  mix: { pilsen: 5, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  forma_pagamento: 'PIX',
  contato: { nome_completo: 'Juliana', telefone_responsavel: '31 99999-1111' },
};
const msgEquip = gerarTextoMensagemWhatsApp(estadoEquipWhatsApp, 'final', 8, 'Cotação & Pagamento');
assert(
  msgEquip.includes('Chopeira Albanos solicitada (disponibilidade a confirmar)') &&
    msgEquip.includes('Gás CO2 solicitado (disponibilidade a confirmar)') &&
    !msgEquip.includes('inclusa') &&
    !msgEquip.includes('incluso'),
  '35B. Handoff WhatsApp utiliza semântica de solicitação ("solicitada / a confirmar") e não promessa de "inclusa/incluso"'
);

// -----------------------------------------------------------------------------
// GRUPO 13: RODADA 4 — PAGAMENTO & MOTOR FINANCEIRO
// -----------------------------------------------------------------------------
console.log('\n13. PAGAMENTO E MOTOR FINANCEIRO (PIX, CARTÃO E NEUTRALIDADE):');

// 36A: DINHEIRO eliminado dos canais de entrada e URL adapter
const resUrlDinheiro = importarParametrosURL(
  new URLSearchParams('forma_pagamento=DINHEIRO'),
  ESTADO_INICIAL
);
assert(
  resUrlDinheiro.novoEstado.forma_pagamento === 'A_DEFINIR',
  '36A. DINHEIRO é rejeitado na URL e estado permanece em A_DEFINIR'
);

// 36B: Desconto de 5% de barganha é exclusivo para PIX
const orcamentoBarganhaCartao = calcularOrcamento({
  barrisTotal: 2,
  mix: { pilsen: 2, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  frete: { status: 'FIXADO', valor: 50, faixaNome: 'BH' },
  formaPagamento: 'CARTAO',
  parcelasCartao: 1,
  houveBarganha: true, // Cupom/barganha presente
});
assert(
  orcamentoBarganhaCartao.descontoAplicado === false &&
    orcamentoBarganhaCartao.descontoBarganhaValor === 0,
  '36B. Desconto de 5% de barganha/cupom NÃO é aplicado para Cartão de Crédito'
);

// 36C: A_DEFINIR é financeiramente neutro mesmo com cupom/barganha
const orcamentoBarganhaADefinir = calcularOrcamento({
  barrisTotal: 2,
  mix: { pilsen: 2, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  frete: { status: 'FIXADO', valor: 50, faixaNome: 'BH' },
  formaPagamento: 'A_DEFINIR',
  houveBarganha: true,
});
assert(
  orcamentoBarganhaADefinir.descontoAplicado === false &&
    orcamentoBarganhaADefinir.descontoBarganhaValor === 0 &&
    orcamentoBarganhaADefinir.totalGeral === 1380 + 50,
  '36C. A_DEFINIR com cupom não antecipa condição de PIX e permanece neutro'
);

// 36D: Ao escolher Cartão, parcelas começam indefinidas
const estadoCartaoSemParcelas = aplicarMudancaEstado(ESTADO_INICIAL, 'forma_pagamento', 'CARTAO');
assert(
  estadoCartaoSemParcelas.parcelas_cartao === undefined,
  '36D. Selecionar Cartão não define parcelas automaticamente (parcelas_cartao = undefined)'
);

// 36E: Mudança de pagamento recalcula total imediatamente e preserva dados do lead
let estadoTransicao: CalculatorState = {
  ...ESTADO_INICIAL,
  contato: { nome_completo: 'Carlos Teste', telefone_responsavel: '31 99999-8888', email: 'carlos@teste.com' },
  barris_total_escolhidos: 2,
  mix: { pilsen: 2, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  frete: { status: 'FIXADO', valor: 50, faixaNome: 'BH' },
  houve_barganha: true,
  forma_pagamento: 'A_DEFINIR',
};
estadoTransicao = aplicarMudancaEstado(estadoTransicao, 'forma_pagamento', 'PIX');
assert(
  estadoTransicao.forma_pagamento === 'PIX' &&
    estadoTransicao.orcamento?.descontoAplicado === true &&
    estadoTransicao.contato.nome_completo === 'Carlos Teste' &&
    estadoTransicao.contato.telefone_responsavel === '31 99999-8888' &&
    estadoTransicao.contato.email === 'carlos@teste.com',
  '36E. Mudança para PIX aplica desconto imediatamente e preserva dados de contato'
);

// -----------------------------------------------------------------------------
// GRUPO 14: RODADA 6 — CANAL OPERACIONAL, RESPONSABILIDADE & HANDOFF WHATSAPP
// -----------------------------------------------------------------------------
console.log('\n14. CANAL OPERACIONAL, RESPONSABILIDADE E HANDOFF WHATSAPP:');

// 37A: Número oficial do WhatsApp é único: +55 32 8822-3023 (553288223023)
assert(
  WHATSAPP_ALBANOS_NUMERO === '553288223023',
  '37A. Destino único do WhatsApp é 553288223023 (+55 32 8822-3023)'
);

const linkGerado = gerarLinkWhatsApp(estadoAceite, 'final', undefined, 8, 'Cotação & Pagamento');
assert(
  linkGerado.startsWith('https://wa.me/553288223023?text='),
  '37B. Link wa.me é gerado estritamente com o número comercial canônico 553288223023'
);

// 37C: Frase contextual referencia atendimento com o Time Comercial
const msgFinalHandoff = gerarTextoMensagemWhatsApp(estadoAceite, 'final', 8, 'Cotação & Pagamento');
assert(
  msgFinalHandoff.includes('Time Comercial') &&
    msgFinalHandoff.includes('Confirmei minha cotação') &&
    !msgFinalHandoff.includes('reserva garantida') &&
    !msgFinalHandoff.includes('chopeira garantida'),
  '37C. Mensagem de handoff direciona explicitamente para o Time Comercial Albanos sem promessas automáticas de reserva'
);

// 37D: Handoff consolida e transmite todos os parâmetros operacionais conhecidos
assert(
  msgFinalHandoff.includes('Lucas Mendes') &&
    msgFinalHandoff.includes('31 99999-9999') &&
    msgFinalHandoff.includes('lucas@exemplo.com.br') &&
    msgFinalHandoff.includes('Chopp:') &&
    msgFinalHandoff.includes('Cotação:') &&
    msgFinalHandoff.includes('Cartão (3x de'),
  '37D. Handoff consolida e transmite identificação completa, dados de chope, frete e pagamento'
);

// -----------------------------------------------------------------------------
// GRUPO 15: RODADA 6.1 — INTEGRIDADE DE ESTADO E EVENTO ESPECIAL
// -----------------------------------------------------------------------------
console.log('\n15. RODADA 6.1 — INTEGRIDADE DE ESTADO E EVENTO ESPECIAL:');

// 1. Evento normal 4h calcula normalmente
let est61 = aplicarMudancaEstado(ESTADO_INICIAL, 'qtd_adultos', 50);
est61 = aplicarMudancaEstado(est61, 'duracao_horas', 4);
est61 = aplicarMudancaEstado(est61, 'outras_bebidas_alcoolicas', 'NAO');
assert(
  est61.duracao_horas === 4 && est61.litros_estimados === 75,
  '6.1.1. Evento normal 4h calcula litros normalmente (50 adultos x 1.5L = 75L)'
);

// 2. Marcar evento especial -> 4h deixa de existir
est61 = aplicarMudancaEstado(est61, 'evento_longo_ou_multiplos_dias', true);
assert(
  est61.duracao_horas === undefined,
  '6.1.2. Ao marcar evento especial, a duração de 4h anterior deixa de existir (undefined)'
);

// 3. Litros anteriores deixam de existir
assert(
  est61.litros_estimados === undefined,
  '6.1.3. Litros anteriores deixam de existir (undefined) ao ativar evento especial'
);

// 4. Evento especial não recebe 12h automaticamente
assert(
  est61.duracao_horas !== 12 && est61.duracao_horas === undefined,
  '6.1.4. Evento especial NÃO recebe 12h automaticamente nem silenciosamente'
);

// 5. Evento especial não calcula litros
const estModAdultos = aplicarMudancaEstado(est61, 'qtd_adultos', 80);
assert(
  estModAdultos.litros_estimados === undefined,
  '6.1.5. Evento especial NÃO calcula litros automaticamente mesmo ao alterar público'
);

// 6. Evento especial não consegue avançar usando barris residuais
assert(
  est61.barris_total_escolhidos === undefined && est61.cenario_quantidade === undefined,
  '6.1.6. Evento especial invalida barris_total_escolhidos e cenario_quantidade'
);

// 7. Voltar ao modo normal exige nova duração
let estVoltaNormal = aplicarMudancaEstado(est61, 'evento_longo_ou_multiplos_dias', false);
assert(
  estVoltaNormal.duracao_horas === undefined && estVoltaNormal.litros_estimados === undefined,
  '6.1.7A. Voltar ao modo normal mantém duração e litros indefinidos até escolha explícita'
);
estVoltaNormal = aplicarMudancaEstado(estVoltaNormal, 'duracao_horas', 5);
assert(
  estVoltaNormal.duracao_horas === 5 && estVoltaNormal.litros_estimados !== undefined,
  '6.1.7B. Nova duração inteira informada permite cálculo normal (50 x 1.65 = 83L)'
);

// 8. Mudar mix entre dois estilos de mesmo preço invalida aceite
let estMixAceite: CalculatorState = {
  ...ESTADO_INICIAL,
  barris_total_escolhidos: 2,
  mix: { pilsen: 0, life_lager: 0, session_ipa: 0, amber: 2, american_ipa: 0, pale_ale: 0 },
  revisao_pre_orcamento_confirmada: true,
  aceite_orcamento: 'SIM',
  forma_pagamento: 'PIX',
};
// Amber (R$ 850) -> Pale Ale (R$ 850): Preço total é idêntico!
const estMixAlterado = aplicarMudancaEstado(estMixAceite, 'mix', {
  pilsen: 0, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 2,
});
assert(
  estMixAlterado.aceite_orcamento === 'PENDENTE',
  '6.1.8A. Mudar mix entre dois estilos de mesmo preço invalida aceite_orcamento para PENDENTE'
);
assert(
  estMixAlterado.revisao_pre_orcamento_confirmada === false,
  '6.1.8B. Mudar mix entre dois estilos de mesmo preço invalida revisao_pre_orcamento_confirmada para false'
);

// 9. Mudar equipamento invalida revisão
let estEquipRevisao: CalculatorState = {
  ...ESTADO_INICIAL,
  precisa_chopeira: false,
  revisao_pre_orcamento_confirmada: true,
  aceite_orcamento: 'SIM',
};
const estEquipAlterado = aplicarMudancaEstado(estEquipRevisao, 'precisa_chopeira', true);
assert(
  estEquipAlterado.revisao_pre_orcamento_confirmada === false,
  '6.1.9A. Mudar resposta de equipamento invalida revisão para false'
);
assert(
  estEquipAlterado.aceite_orcamento === 'PENDENTE',
  '6.1.9B. Mudar resposta de equipamento invalida aceite para PENDENTE'
);

// 10. Mudar logística invalida revisão
let estLogisticaRevisao: CalculatorState = {
  ...ESTADO_INICIAL,
  modalidade_logistica: 'RETIRADA_FABRICA',
  revisao_pre_orcamento_confirmada: true,
  aceite_orcamento: 'SIM',
};
const estLogisticaAlterado = aplicarMudancaEstado(estLogisticaRevisao, 'modalidade_logistica', 'ENTREGA');
assert(
  estLogisticaAlterado.revisao_pre_orcamento_confirmada === false,
  '6.1.10A. Mudar modalidade logística invalida revisão para false'
);
assert(
  estLogisticaAlterado.aceite_orcamento === 'PENDENTE',
  '6.1.10B. Mudar modalidade logística invalida aceite para PENDENTE'
);

// 11. Mudar evento após aceite invalida aceite
let estEventoAceite: CalculatorState = {
  ...ESTADO_INICIAL,
  data_evento: '2026-12-01',
  revisao_pre_orcamento_confirmada: true,
  aceite_orcamento: 'SIM',
};
const estEventoAlterado = aplicarMudancaEstado(estEventoAceite, 'data_evento', '2026-12-02');
assert(
  estEventoAlterado.aceite_orcamento === 'PENDENTE',
  '6.1.11A. Mudar data do evento após aceite invalida aceite para PENDENTE'
);
assert(
  estEventoAlterado.revisao_pre_orcamento_confirmada === false,
  '6.1.11B. Mudar data do evento após aceite invalida revisão para false'
);

// 12. Data "hoje" utiliza calendário local
const dataHoje = obterDataHojeIso();
const agoraLocal = new Date();
const esperadoLocal = `${agoraLocal.getFullYear()}-${String(agoraLocal.getMonth() + 1).padStart(2, '0')}-${String(agoraLocal.getDate()).padStart(2, '0')}`;
assert(
  dataHoje === esperadoLocal,
  '6.1.12. Função obterDataHojeIso() utiliza calendário local do cliente (ano, mês e dia locais)'
);

// -----------------------------------------------------------------------------
// GRUPO 16: RODADA 6.2 — HARDENING DE INPUTS, URL ADAPTER E GATES
// -----------------------------------------------------------------------------
console.log('\n16. RODADA 6.2 — HARDENING DE INPUTS, URL ADAPTER E GATES:');

// 6.2.1: Validadores canônicos unificados
assert(!validarInteiroEstrito(4.5), '6.2.1A. validarInteiroEstrito rejeita número decimal 4.5');
assert(!validarInteiroEstrito('4.5'), '6.2.1B. validarInteiroEstrito rejeita string decimal 4.5');
assert(parsearInteiroEstrito('4.5') === null, '6.2.1C. parsearInteiroEstrito retorna null para decimal');
assert(parsearInteiroEstrito('12') === 12, '6.2.1D. parsearInteiroEstrito converte inteiro estrito corretamente');

// 6.2.2: Duração aceita somente 1..12 inteiros estritos
assert(!validarDuracaoHoras(4.5), '6.2.2A. Duração 4.5h rejeitada');
assert(!validarDuracaoHoras(4.9), '6.2.2B. Duração 4.9h rejeitada');
assert(!validarDuracaoHoras(0), '6.2.2C. Duração zero rejeitada');
assert(!validarDuracaoHoras(-2), '6.2.2D. Duração negativa rejeitada');
assert(!validarDuracaoHoras(13), '6.2.2E. Duração > 12h rejeitada');
assert(validarDuracaoHoras(1), '6.2.2F. Duração 1h aceita');
assert(validarDuracaoHoras(12), '6.2.2G. Duração 12h aceita');

// URL Adapter com duração fracionada
const urlDuracaoFrac = parsearParametrosUrl('?src=iara&duracao_horas=4.5');
const resDuracaoFrac = importarParametrosURL(urlDuracaoFrac, ESTADO_INICIAL);
assert(
  resDuracaoFrac.novoEstado.duracao_horas === undefined && resDuracaoFrac.parametrosIgnorados >= 1,
  '6.2.2H. URL com duracao_horas=4.5 é ignorada sem floor/arredondamento e não preenche o estado'
);

// 6.2.3: Nome, telefone e e-mail
assert(!validarNomeLead('  ab  '), '6.2.3A. Nome com menos de 3 caracteres rejeitado');
assert(validarNomeLead('Ana'), '6.2.3B. Nome com 3 caracteres válido');
assert(!validarTelefoneLead('12345'), '6.2.3C. Telefone com menos de 10 dígitos rejeitado');
assert(!validarTelefoneLead('1234567890123'), '6.2.3D. Telefone com mais de 11 dígitos rejeitado');
assert(validarTelefoneLead('(31) 98888-7777'), '6.2.3E. Telefone celular com DDD aceito');
assert(validarTelefoneLead('3133334444'), '6.2.3F. Telefone fixo com DDD aceito');
assert(validarEmailLead(''), '6.2.3G. E-mail vazio é aceito (campo opcional)');
assert(!validarEmailLead('teste-invalido'), '6.2.3H. E-mail sem @ ou domínio rejeitado');

const urlContatoInvalido = parsearParametrosUrl('?src=iara&nome=ab&telefone=12345&email=invalido');
const resContatoInvalido = importarParametrosURL(urlContatoInvalido, ESTADO_INICIAL);
assert(
  !resContatoInvalido.novoEstado.contato?.nome_completo &&
    !resContatoInvalido.novoEstado.contato?.telefone_responsavel &&
    !resContatoInvalido.novoEstado.contato?.email,
  '6.2.3I. URL com dados de contato inválidos rejeita cada campo e não corrompe o estado'
);

// 6.2.4: Horários e Datas
assert(!validarHorarioValido('25:00'), '6.2.4A. Horário 25:00 rejeitado como impossível');
assert(!validarHorarioValido('12:78'), '6.2.4B. Horário 12:78 rejeitado por minuto inválido');
assert(!validarHorarioValido('99:99'), '6.2.4C. Horário 99:99 rejeitado');
assert(validarHorarioValido('14:30'), '6.2.4D. Horário 14:30 válido');

assert(!validarDataIsoValida('2026-02-30'), '6.2.4E. Data 30 de fevereiro rejeitada como inexistente');
assert(!validarDataIsoValida('2026-11-31'), '6.2.4F. Data 31 de novembro rejeitada (mês de 30 dias)');
assert(validarDataIsoValida('2026-11-20'), '6.2.4G. Data real de calendário válida');

const urlHoraInvalida = parsearParametrosUrl('?src=iara&horario_inicio_evento=12:78&data_evento=2026-02-30');
const resHoraInvalida = importarParametrosURL(urlHoraInvalida, ESTADO_INICIAL);
assert(
  resHoraInvalida.novoEstado.horario_inicio_evento === undefined &&
    resHoraInvalida.novoEstado.data_evento === undefined,
  '6.2.4H. URL Adapter rejeita horário impossível e data inexistente'
);

// 6.2.5: Inteiros estritos (sem Math.floor ou coerção silenciosa)
const urlInteirosFloat = parsearParametrosUrl(
  '?src=iara&qtd_adultos=20.5&barris_total_escolhidos=3.2&parcelas_cartao=2.7'
);
const resInteirosFloat = importarParametrosURL(urlInteirosFloat, ESTADO_INICIAL);
assert(
  resInteirosFloat.novoEstado.qtd_adultos === undefined &&
    resInteirosFloat.novoEstado.barris_total_escolhidos === undefined &&
    resInteirosFloat.novoEstado.parcelas_cartao === undefined,
  '6.2.5. URL Adapter rejeita decimais em adultos, barris e parcelas sem aplicar floor silencioso'
);

// 6.2.6 & 6.2.7: Revisão e Aceite nunca podem ser fabricados por URL
const urlFabricada = parsearParametrosUrl(
  '?src=iara&revisao_pre_orcamento_confirmada=true&aceite_orcamento=SIM'
);
const resFabricada = importarParametrosURL(urlFabricada, ESTADO_INICIAL);
assert(
  resFabricada.novoEstado.revisao_pre_orcamento_confirmada === false,
  '6.2.6. URL nunca pode marcar revisao_pre_orcamento_confirmada como true'
);
assert(
  resFabricada.novoEstado.aceite_orcamento === 'PENDENTE',
  '6.2.7. URL nunca pode colocar aceite_orcamento como SIM'
);

// 6.2.8: URL Adapter limpo e seguro
assert(
  resFabricada.parametrosIgnorados >= 2,
  '6.2.8. Tentativas de injeção de revisão ou aceite incrementam parametrosIgnorados com log de auditoria'
);

// 6.2.9: Auditoria de Gates estritos
// 1. Estado inicial -> Etapa 1
assert(determinarEtapaPorGates(ESTADO_INICIAL) === 1, '6.2.9A. Estado inicial sem dados direciona para Etapa 1');

// 2. Evento completo sem barris -> Etapa 2
const estEventoCompleto: CalculatorState = {
  ...ESTADO_INICIAL,
  data_evento: '2026-11-20',
  horario_inicio_evento: '14:00',
  cidade: 'Belo Horizonte',
  qtd_adultos: 50,
  duracao_horas: 4,
  outras_bebidas_alcoolicas: 'NAO',
};
assert(determinarEtapaPorGates(estEventoCompleto) === 2, '6.2.9B. Evento completo sem barris direciona para Etapa 2');

// 3. Evento especial (>12h ou múltiplos dias) para na Etapa 2 para contato comercial (não pula para Etapa 3)
const estEspecialComTudo: CalculatorState = {
  ...estEventoCompleto,
  duracao_horas: undefined,
  evento_longo_ou_multiplos_dias: true,
  barris_total_escolhidos: 5,
  mix: { pilsen: 5, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  precisa_chopeira: true,
  precisa_gas: true,
  modalidade_logistica: 'RETIRADA_FABRICA',
  data_retirada: '2026-11-20',
  hora_retirada: '11:00',
};
assert(
  determinarEtapaPorGates(estEspecialComTudo) === 2,
  '6.2.9C. Evento especial (>12h) para na Etapa 2 para atendimento comercial e não pula para Mix'
);

// 4. Barris definidos mas mix não fecha -> Etapa 3
const estBarrisSemMix: CalculatorState = {
  ...estEventoCompleto,
  barris_total_escolhidos: 2,
  mix: { pilsen: 1, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
};
assert(determinarEtapaPorGates(estBarrisSemMix) === 3, '6.2.9D. Mix divergente de barris_total_escolhidos trava na Etapa 3');

// 5. Mix fechado mas equipamentos indefinidos -> Etapa 4
const estMixSemEquip: CalculatorState = {
  ...estEventoCompleto,
  barris_total_escolhidos: 2,
  mix: { pilsen: 2, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 },
  precisa_chopeira: undefined,
  precisa_gas: undefined,
};
assert(determinarEtapaPorGates(estMixSemEquip) === 4, '6.2.9E. Equipamentos indefinidos travam na Etapa 4');

// 6. Equipamentos respondidos mas logística indefinida -> Etapa 5
const estEquipSemLogistica: CalculatorState = {
  ...estMixSemEquip,
  precisa_chopeira: true,
  precisa_gas: true,
  modalidade_logistica: 'A_DEFINIR',
};
assert(determinarEtapaPorGates(estEquipSemLogistica) === 5, '6.2.9F. Logística indefinida trava na Etapa 5');

// 7. Logística completa mas revisão não confirmada -> Etapa 6
const estLogisticaCompletaSemRevisao: CalculatorState = {
  ...estEquipSemLogistica,
  modalidade_logistica: 'RETIRADA_FABRICA',
  data_retirada: '2026-11-20',
  hora_retirada: '11:00',
  revisao_pre_orcamento_confirmada: false,
};
assert(
  determinarEtapaPorGates(estLogisticaCompletaSemRevisao) === 6,
  '6.2.9G. Logística completa sem revisão confirmada trava na Etapa 6'
);

// 8. Revisão confirmada mas sem identificação do lead -> Etapa 7
const estRevisaoConfirmadaSemLead: CalculatorState = {
  ...estLogisticaCompletaSemRevisao,
  revisao_pre_orcamento_confirmada: true,
  contato: { nome_completo: '', telefone_responsavel: '' },
};
assert(
  determinarEtapaPorGates(estRevisaoConfirmadaSemLead) === 7,
  '6.2.9H. Revisão confirmada sem identificação do lead trava na Etapa 7'
);

// 9. Revisão confirmada e identificação completa -> Etapa 8
const estProntoParaOrcamento: CalculatorState = {
  ...estRevisaoConfirmadaSemLead,
  contato: { nome_completo: 'Carlos Silva', telefone_responsavel: '31 98888-1234' },
};
assert(
  determinarEtapaPorGates(estProntoParaOrcamento) === 8,
  '6.2.9I. Revisão confirmada e lead identificado libera acesso à Etapa 8 (Cotação)'
);

// -----------------------------------------------------------------------------
// GRUPO 17: RODADA 6.3 — ACEITE, WHATSAPP E SEMÂNTICA COMERCIAL
// -----------------------------------------------------------------------------
console.log('\n17. RODADA 6.3 — ACEITE, WHATSAPP E SEMÂNTICA COMERCIAL:');

// Estado base de teste pronto na Etapa 8 com cotação calculada
const estEtapa8Base: CalculatorState = {
  ...estProntoParaOrcamento,
  forma_pagamento: 'PIX',
  aceite_orcamento: 'PENDENTE',
};
estEtapa8Base.orcamento = calcularOrcamento({
  barrisTotal: estEtapa8Base.barris_total_escolhidos || 2,
  mix: estEtapa8Base.mix,
  frete: estEtapa8Base.frete,
  formaPagamento: 'PIX',
  houveBarganha: false,
});

// 6.3.1A: Handoff preventivo na Etapa 8 NÃO é tratado como final
const msgPreventivaEtapa8 = gerarTextoMensagemWhatsApp(estEtapa8Base, 'preventivo', 8, 'Cotação & Pagamento');
assert(
  !msgPreventivaEtapa8.includes('Cotação Confirmada pelo Cliente') &&
    msgPreventivaEtapa8.includes('Atendimento Calculadora') &&
    msgPreventivaEtapa8.includes('Etapa 8/8'),
  '6.3.1A. Preventivo na Etapa 8 NÃO é tratado como final e exibe cabeçalho de atendimento'
);

// 6.3.1B: Preventivo na Etapa 8 não alega confirmação e apenas tira dúvidas
assert(
  msgPreventivaEtapa8.includes('ainda não confirmei') &&
    !msgPreventivaEtapa8.includes('Confirmei minha cotação'),
  '6.3.1B. Preventivo na Etapa 8 informa que ainda não confirmou e pede apoio para dúvidas'
);

// 6.3.1C: Handoff final SÓ ocorre com aceite_orcamento === 'SIM' E tipoHandoff === 'final'
const estAceiteReal: CalculatorState = {
  ...estEtapa8Base,
  aceite_orcamento: 'SIM',
};
const msgFinalReal = gerarTextoMensagemWhatsApp(estAceiteReal, 'final', 8, 'Cotação & Pagamento');
assert(
  msgFinalReal.includes('Cotação Confirmada pelo Cliente') &&
    msgFinalReal.includes('Confirmei minha cotação no aplicativo'),
  '6.3.1C. Handoff final com aceite_orcamento=SIM reflete cotação confirmada pelo cliente'
);

// 6.3.1D: tipoHandoff === 'final' com aceite_orcamento === 'PENDENTE' não vaza confirmação
const msgFinalSemAceite = gerarTextoMensagemWhatsApp(estEtapa8Base, 'final', 8, 'Cotação & Pagamento');
assert(
  !msgFinalSemAceite.includes('Cotação Confirmada pelo Cliente') &&
    msgFinalSemAceite.includes('Atendimento Calculadora'),
  '6.3.1D. tipoHandoff final com aceite_orcamento=PENDENTE defende o invariante e não simula confirmação'
);

// 6.3.2: Snapshot final criado como consequência da confirmação
const snapshotConfirmado: CalculatorState = {
  ...estEtapa8Base,
  aceite_orcamento: 'SIM',
};
const linkConfirmado = gerarLinkWhatsApp(snapshotConfirmado, 'final', undefined, 8, 'Cotação & Pagamento');
assert(
  linkConfirmado.includes(encodeURIComponent('Cotação Confirmada pelo Cliente')),
  '6.3.2. Snapshot com aceite_orcamento=SIM gera link de fechamento com integridade'
);

// 6.3.3A: Mudança de forma de pagamento tira UI do estado confirmado (redefine para PENDENTE)
const estMudouPagto = aplicarMudancaEstado(estAceiteReal, 'forma_pagamento', 'CARTAO');
assert(
  estMudouPagto.aceite_orcamento === 'PENDENTE',
  '6.3.3A. Mudança de forma de pagamento redefine aceite_orcamento para PENDENTE'
);

// 6.3.3B: Mudança de parcelas cartão tira UI do estado confirmado
const estCartaoAceito = aplicarMudancaEstado(
  { ...estAceiteReal, forma_pagamento: 'CARTAO', parcelas_cartao: 2 },
  'aceite_orcamento',
  'SIM'
);
const estMudouParcelas = aplicarMudancaEstado(estCartaoAceito, 'parcelas_cartao', 3);
assert(
  estMudouParcelas.aceite_orcamento === 'PENDENTE',
  '6.3.3B. Mudança de parcelas no cartão redefine aceite_orcamento para PENDENTE'
);

// 6.3.3C: Mudança de cupom/barganha tira UI do estado confirmado
const estMudouBarganha = aplicarMudancaEstado(estAceiteReal, 'houve_barganha', true);
assert(
  estMudouBarganha.aceite_orcamento === 'PENDENTE',
  '6.3.3C. Aplicação ou alteração de cupom/barganha redefine aceite_orcamento para PENDENTE'
);

// 6.3.3D: Mudança de mix tira UI do estado confirmado
const estMudouMix = aplicarMudancaEstado(estAceiteReal, 'mix', {
  pilsen: 1, session_ipa: 1, amber: 0, life_lager: 0, american_ipa: 0, pale_ale: 0,
});
assert(
  estMudouMix.aceite_orcamento === 'PENDENTE',
  '6.3.3D. Mudança no mix de estilos redefine aceite_orcamento para PENDENTE'
);

// 6.3.4A & 6.3.4B: Proibições de copy (não alegar mensagem enviada, conversa iniciada, etc.)
assert(
  !msgFinalReal.includes('mensagem enviada') &&
    !msgFinalReal.includes('mensagem recebida') &&
    !msgFinalReal.includes('solicitação encaminhada') &&
    !msgFinalReal.includes('conversa iniciada') &&
    !msgFinalReal.includes('reserva confirmada') &&
    !msgFinalReal.includes('estoque confirmado') &&
    !msgFinalReal.includes('equipamento garantido') &&
    !msgFinalReal.includes('pagamento recebido'),
  '6.3.4. Mensagens do WhatsApp não afirmam falsamente envio, recebimento, reserva de estoque ou pagamento recebido'
);

// 6.3.5: Não fazer promessa de continuidade imediata
assert(
  !msgFinalReal.includes('continuidade imediata') &&
    !msgPreventivaEtapa8.includes('continuidade imediata'),
  '6.3.5. Mensagens não contêm promessa de continuidade imediata'
);

// 6.3.6: Responsabilidade de atendimento atribuída ao Time Comercial Albanos
assert(
  msgFinalReal.includes('Time Comercial') &&
    msgPreventivaEtapa8.includes('Time Comercial'),
  '6.3.6. Atendimento é referenciado canonicamente ao Time Comercial Albanos'
);

// 6.3.7: Equipamentos e logística não prometem montagem inclusa
assert(
  !msgFinalReal.includes('montagem inclusa') &&
    !msgPreventivaEtapa8.includes('montagem'),
  '6.3.7. Entrega e equipamentos não prometem montagem inclusa automaticamente'
);

// 6.3.8: Evento especial (>12h) NUNCA gera cotação confirmada
const estEspecialFinal: CalculatorState = {
  ...estAceiteReal,
  evento_longo_ou_multiplos_dias: true,
  duracao_horas: undefined,
};
const msgEspecialTentativaFinal = gerarTextoMensagemWhatsApp(estEspecialFinal, 'final', 2, 'Dimensionamento');
assert(
  !msgEspecialTentativaFinal.includes('Cotação Confirmada pelo Cliente') &&
    msgEspecialTentativaFinal.includes('Atendimento Calculadora'),
  '6.3.8. Evento especial (>12h) NUNCA gera Cotação Confirmada pelo Cliente'
);

// 6.3.9: WhatsApp link utiliza estritamente o número canônico oficial
const linkFinalCanonico = gerarLinkWhatsApp(estAceiteReal, 'final', undefined, 8);
assert(
  linkFinalCanonico.startsWith('https://wa.me/553288223023?'),
  '6.3.9. Link wa.me gerado estritamente com número canônico 553288223023'
);

console.log('\n======================================================');
console.log(`TOTAL DE TESTES: ${totalTests} | APROVADOS: ${passedTests} | FALHAS: ${totalTests - passedTests}`);
console.log('======================================================\n');
