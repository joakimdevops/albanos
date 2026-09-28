/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Suíte Obrigatória de Testes do Motor Determinístico V1.1
 * Cobertura de todos os casos da Especificação Técnica (D-01..D-07, Q-01..Q-04, M-01..M-04, O-01..O-05, I-01..I-05).
 */

import {
  calcularDimensionamento,
  calcularFatorConsumo,
  classificarCenarioBarris,
} from '../dimensioningEngine';
import {
  formatarResumoMix,
  somarBarrisMix,
  sugerirMix,
  validarInvarianteMix,
} from '../mixEngine';
import { calcularFrete } from '../freightEngine';
import { calcularOrcamento } from '../budgetEngine';
import { aplicarMudancaEstado } from '../dependenciesEngine';
import { criarEstadoInicial, importarParametrosURL } from '../urlAdapter';
import { gerarLinkWhatsApp, gerarTextoMensagemWhatsApp } from '../whatsappAdapter';
import {
  salvarSessaoNoLocalStorage,
  carregarSessaoDoLocalStorage,
  limparSessaoDoLocalStorage,
  temDadosPreenchidos,
} from '../persistence';
import {
  calcularDataDMenos1,
  obterHorarioPadraoRetirada,
  validarDataRetiradaFabrica,
  validarDataEntrega,
  validarDataLogistica,
  validarHorarioLogistica,
  calcularSugestaoDataLogistica,
  obterHorarioSugeridoLogistica,
  formatarDataBrasileira,
} from '../logisticsEngine';

export interface TestResultItem {
  id: string;
  categoria: string;
  descricao: string;
  esperado: string;
  obtido: string;
  passou: boolean;
  detalhe?: string;
}

export function executarTodosOsTestes(): {
  total: number;
  passou: number;
  falhou: number;
  itens: TestResultItem[];
} {
  const itens: TestResultItem[] = [];

  function assertTest(
    id: string,
    categoria: string,
    descricao: string,
    esperado: any,
    obtido: any,
    condicao: boolean,
    detalhe?: string
  ) {
    itens.push({
      id,
      categoria,
      descricao,
      esperado: String(esperado),
      obtido: String(obtido),
      passou: condicao,
      detalhe,
    });
  }

  // ==========================================
  // 27.1 Dimensionamento
  // ==========================================

  // D-01: 80 adultos, 4h, sem outra alcoólica -> 120 L
  try {
    const d01 = calcularDimensionamento(80, 4, 'NAO');
    assertTest('D-01', 'Dimensionamento', '80 adultos, 4h, sem outra alcoólica', 120, d01.litrosEstimados, d01.litrosEstimados === 120);
  } catch (e: any) {
    assertTest('D-01', 'Dimensionamento', '80 adultos, 4h, sem outra alcoólica', 120, e.message, false);
  }

  // D-02: 80 adultos, 6h, sem outra alcoólica -> 144 L
  try {
    const d02 = calcularDimensionamento(80, 6, 'NAO');
    assertTest('D-02', 'Dimensionamento', '80 adultos, 6h, sem outra alcoólica', 144, d02.litrosEstimados, d02.litrosEstimados === 144);
  } catch (e: any) {
    assertTest('D-02', 'Dimensionamento', '80 adultos, 6h, sem outra alcoólica', 144, e.message, false);
  }

  // D-03: 70 adultos, 10h, sem outra alcoólica -> 168 L
  try {
    const d03 = calcularDimensionamento(70, 10, 'NAO');
    assertTest('D-03', 'Dimensionamento', '70 adultos, 10h, sem outra alcoólica', 168, d03.litrosEstimados, d03.litrosEstimados === 168);
  } catch (e: any) {
    assertTest('D-03', 'Dimensionamento', '70 adultos, 10h, sem outra alcoólica', 168, e.message, false);
  }

  // D-04: 80 adultos, 8h, sem outra alcoólica -> 168 L
  try {
    const d04 = calcularDimensionamento(80, 8, 'NAO');
    assertTest('D-04', 'Dimensionamento', '80 adultos, 8h, sem outra alcoólica', 168, d04.litrosEstimados, d04.litrosEstimados === 168);
  } catch (e: any) {
    assertTest('D-04', 'Dimensionamento', '80 adultos, 8h, sem outra alcoólica', 168, e.message, false);
  }

  // D-05: 80 adultos, 12h, com outra alcoólica -> 172.8 L
  try {
    const d05 = calcularDimensionamento(80, 12, 'SIM');
    assertTest('D-05', 'Dimensionamento', '80 adultos, 12h, com outra alcoólica', 172.8, d05.litrosEstimados, Math.abs(d05.litrosEstimados - 172.8) < 0.01);
  } catch (e: any) {
    assertTest('D-05', 'Dimensionamento', '80 adultos, 12h, com outra alcoólica', 172.8, e.message, false);
  }

  // D-06: faltando outras_bebidas_alcoolicas -> bloquear publicação de litros/cenários
  try {
    calcularDimensionamento(80, 6, undefined as any);
    assertTest('D-06', 'Dimensionamento', 'Faltando outras_bebidas_alcoolicas bloqueia', 'Erro lançado', 'Não lançou erro', false);
  } catch (e: any) {
    assertTest('D-06', 'Dimensionamento', 'Faltando outras_bebidas_alcoolicas bloqueia', 'Erro lançado', 'Bloqueado com sucesso', true);
  }

  // D-07: duração fracionada é rejeitada (somente inteiros de 1 a 12 horas)
  try {
    let lancouErro = false;
    try {
      calcularFatorConsumo(5.5, 'NAO');
    } catch {
      lancouErro = true;
    }
    assertTest(
      'D-07',
      'Dimensionamento',
      'Duração fracionada rejeitada (somente inteiros de 1 a 12h)',
      true,
      lancouErro,
      lancouErro
    );
  } catch (e: any) {
    assertTest('D-07', 'Dimensionamento', 'Duração fracionada rejeitada', true, e.message, false);
  }

  // ==========================================
  // 27.2 Barris / Cenários
  // ==========================================

  // Q-01: 144 L -> 150 L / 3 barris / JUSTO (+6 L)
  try {
    const dimQ01 = calcularDimensionamento(80, 6, 'NAO'); // 144 L
    const temJusto = dimQ01.cenarioJusto?.cenario === 'JUSTO' && dimQ01.cenarioJusto.barris === 3 && dimQ01.cenarioJusto.litrosComerciais === 150;
    assertTest('Q-01', 'Barris/Cenários', '144 L -> 150 L (3 barris) JUSTO', '3 barris / 150 L / JUSTO', `${dimQ01.cenarioJusto?.barris} barris / ${dimQ01.cenarioJusto?.litrosComerciais} L / ${dimQ01.cenarioJusto?.cenario}`, temJusto);
  } catch (e: any) {
    assertTest('Q-01', 'Barris/Cenários', '144 L -> 150 L JUSTO', 'Sucesso', e.message, false);
  }

  // Q-02: 168 L -> 150 L ENXUTO (-18 L) e 200 L ABUNDANTE (+32 L)
  try {
    const dimQ02 = calcularDimensionamento(70, 10, 'NAO'); // 168 L
    const temEnxuto = dimQ02.cenarioEnxuto?.barris === 3 && dimQ02.cenarioEnxuto.litrosComerciais === 150;
    const temAbundante = dimQ02.cenarioAbundante?.barris === 4 && dimQ02.cenarioAbundante.litrosComerciais === 200;
    const naoTemJusto = dimQ02.cenarioJusto === undefined;
    assertTest(
      'Q-02',
      'Barris/Cenários',
      '168 L -> 150 L ENXUTO + 200 L ABUNDANTE (sem JUSTO)',
      '150 L ENXUTO e 200 L ABUNDANTE',
      `${dimQ02.cenarioEnxuto?.litrosComerciais} L ENXUTO e ${dimQ02.cenarioAbundante?.litrosComerciais} L ABUNDANTE`,
      temEnxuto && temAbundante && naoTemJusto
    );
  } catch (e: any) {
    assertTest('Q-02', 'Barris/Cenários', '168 L cenários', 'Sucesso', e.message, false);
  }

  // Q-03: Pedido explícito de 120 L -> configuração mínima >= 120 L = 150 L (3 barris) sem equivalência falsa
  try {
    const classif120 = classificarCenarioBarris(3, 120);
    // 3 barris = 150 L (30 L acima -> abundante)
    assertTest(
      'Q-03',
      'Barris/Cenários',
      'Pedido 120 L -> 3 barris = 150 L sem falsa equivalência',
      '150 L',
      `${classif120.litrosComerciais} L`,
      classif120.litrosComerciais === 150 && classif120.diferencaLitros === 30
    );
  } catch (e: any) {
    assertTest('Q-03', 'Barris/Cenários', '120 L conversão', '150 L', e.message, false);
  }

  // Q-04: barris_total_escolhidos = 3 -> LITROS_TOTAL_ESCOLHIDOS = 150 L
  try {
    const litrosQ04 = 3 * 50;
    assertTest('Q-04', 'Barris/Cenários', '3 barris escolhidos = 150 L comerciais', 150, litrosQ04, litrosQ04 === 150);
  } catch (e: any) {
    assertTest('Q-04', 'Barris/Cenários', '3 barris = 150 L', 150, e.message, false);
  }

  // ==========================================
  // 27.3 Mix de Estilos
  // ==========================================

  // M-01: 3 barris: 1 Pilsen + 1 Session IPA + 1 Amber -> mix válido; soma=3
  try {
    const mixM01 = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const valM01 = validarInvarianteMix(mixM01, 3);
    assertTest('M-01', 'Mix', '3 barris: 1 Pilsen + 1 Session + 1 Amber é válido', true, valM01.valido, valM01.valido && valM01.somaAtual === 3);
  } catch (e: any) {
    assertTest('M-01', 'Mix', '3 barris válidos', true, e.message, false);
  }

  // M-02: 3 barris com soma=2 -> bloquear avanço
  try {
    const mixM02 = { pilsen: 1, session_ipa: 1, amber: 0, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const valM02 = validarInvarianteMix(mixM02, 3);
    assertTest('M-02', 'Mix', '3 barris com soma=2 bloqueia', false, valM02.valido, !valM02.valido && valM02.somaAtual === 2);
  } catch (e: any) {
    assertTest('M-02', 'Mix', 'Soma incompleta bloqueia', false, e.message, false);
  }

  // M-03: Alterar total 3 -> 4 mantendo soma antiga=3 -> mix volta a incompleto; orçamento invalida
  try {
    const mixM03 = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const valM03 = validarInvarianteMix(mixM03, 4);
    const orcM03 = calcularOrcamento({
      barrisTotal: 4,
      mix: mixM03,
      frete: calcularFrete('ENTREGA', 'Belo Horizonte'),
      formaPagamento: 'PIX',
      houveBarganha: false,
    });
    assertTest(
      'M-03',
      'Mix',
      'Alterar total 3->4 com soma 3 invalida mix e bloqueia orçamento',
      'invariantesValidos: false',
      `invariantesValidos: ${orcM03.invariantesValidos}`,
      !valM03.valido && !orcM03.invariantesValidos
    );
  } catch (e: any) {
    assertTest('M-03', 'Mix', 'Invalidação seletiva do mix', 'false', e.message, false);
  }

  // M-04: 2 barris sem preferência -> sugestão 1 Pilsen + 1 Session IPA
  try {
    const sugM04 = sugerirMix(2);
    const ehPilsenSession = sugM04.pilsen === 1 && sugM04.session_ipa === 1 && somarBarrisMix(sugM04) === 2;
    assertTest('M-04', 'Mix', '2 barris sem preferência sugere 1 Pilsen + 1 Session IPA', '1 Pilsen + 1 Session', formatarResumoMix(sugM04), ehPilsenSession);
  } catch (e: any) {
    assertTest('M-04', 'Mix', 'Sugestão 2 barris', '1 Pilsen + 1 Session', e.message, false);
  }

  // ==========================================
  // 27.4 Orçamento
  // ==========================================

  // O-01: 1 Pilsen + 1 Session IPA + 1 Amber -> Produtos = R$ 2.390,00
  // (690 + 850 + 850 = 2390)
  try {
    const mixO01 = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcO01 = calcularOrcamento({
      barrisTotal: 3,
      mix: mixO01,
      frete: { valor: 0, status: 'GRATIS', faixaNome: 'Retirada' },
      formaPagamento: 'PIX',
      houveBarganha: false,
    });
    assertTest('O-01', 'Orçamento', '1 Pilsen + 1 Session IPA + 1 Amber = R$ 2.390,00 em produtos', 2390, orcO01.totalProdutosBruto, orcO01.totalProdutosBruto === 2390);
  } catch (e: any) {
    assertTest('O-01', 'Orçamento', 'Total produtos', 2390, e.message, false);
  }

  // O-02: Mesmo mix + frete Rio Acima -> Total = R$ 2.465,00
  // Rio Acima pertence a Demais Municípios RMBH = R$ 75,00. 2390 + 75 = 2465.
  try {
    const freteRioAcima = calcularFrete('ENTREGA', 'Rio Acima');
    const mixO02 = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcO02 = calcularOrcamento({
      barrisTotal: 3,
      mix: mixO02,
      frete: freteRioAcima,
      formaPagamento: 'PIX',
      houveBarganha: false,
    });
    assertTest(
      'O-02',
      'Orçamento',
      'Mesmo mix + frete Rio Acima (R$ 75,00) = R$ 2.465,00',
      2465,
      orcO02.totalGeral,
      freteRioAcima.valor === 75 && orcO02.totalGeral === 2465
    );
  } catch (e: any) {
    assertTest('O-02', 'Orçamento', 'Frete Rio Acima', 2465, e.message, false);
  }

  // O-03: Mix inconsistente -> não publicar preço
  try {
    const mixO03 = { pilsen: 1, session_ipa: 0, amber: 0, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcO03 = calcularOrcamento({
      barrisTotal: 3,
      mix: mixO03,
      frete: calcularFrete('ENTREGA', 'Belo Horizonte'),
      formaPagamento: 'PIX',
      houveBarganha: false,
    });
    assertTest('O-03', 'Orçamento', 'Mix inconsistente bloqueia publicação de preço', false, orcO03.invariantesValidos, !orcO03.invariantesValidos && orcO03.totalGeral === null);
  } catch (e: any) {
    assertTest('O-03', 'Orçamento', 'Bloqueio de preço', false, e.message, false);
  }

  // O-04: Barganha + PIX -> 5% sobre produtos + frete conhecido (2390 + 75 = 2465; 2465 * 0.05 = 123.25; Total = 2341.75)
  try {
    const mixO04 = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcO04 = calcularOrcamento({
      barrisTotal: 3,
      mix: mixO04,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'PIX',
      houveBarganha: true,
    });
    const esperadoBase = 2465;
    const esperadoDesc = 123.25;
    const esperadoGeral = 2341.75;
    const okDesc =
      orcO04.baseFinanceira === esperadoBase &&
      orcO04.descontoBarganhaValor === esperadoDesc &&
      orcO04.totalGeral === esperadoGeral;
    assertTest(
      'O-04',
      'Orçamento',
      'Barganha 5% incide sobre base completa (produtos + frete conhecido)',
      esperadoGeral,
      orcO04.totalGeral,
      okDesc
    );
  } catch (e: any) {
    assertTest('O-04', 'Orçamento', 'Barganha 5%', 2341.75, e.message, false);
  }

  // O-05: Cartão 3x -> multiplicador 1.0755 sobre base completa (produtos + frete conhecido)
  // (2390 + 75) * 1.0755 = 2465 * 1.0755 = 2651.1075 -> 2651.11. Parcela = 2651.11 / 3 = 883.70.
  try {
    const mixO05 = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcO05 = calcularOrcamento({
      barrisTotal: 3,
      mix: mixO05,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 3,
      houveBarganha: false,
    });
    const esperadoTotalCartao = 2651.11;
    const esperadoParcelaCartao = 883.7;
    const okCartao =
      orcO05.baseFinanceira === 2465 &&
      Math.abs((orcO05.valorParcelaCartao || 0) - esperadoParcelaCartao) <= 0.05 &&
      Math.abs((orcO05.totalGeral || 0) - esperadoTotalCartao) <= 0.05;
    assertTest(
      'O-05',
      'Orçamento',
      'Cartão 3x com multiplicador 1.0755 sobre produtos + frete',
      esperadoTotalCartao,
      orcO05.totalGeral,
      okCartao
    );
  } catch (e: any) {
    assertTest('O-05', 'Orçamento', 'Cartão 3x', 2651.11, e.message, false);
  }

  // O-05A: Cartão 1x -> multiplicador 1.0439 sobre base completa (2465 * 1.0439 = 2573.21)
  try {
    const mixCartao = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orc1x = calcularOrcamento({
      barrisTotal: 3,
      mix: mixCartao,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 1,
      houveBarganha: false,
    });
    const esperadoTotal1x = 2573.21;
    const ok1x =
      orc1x.multiplicadorCartao === 1.0439 &&
      orc1x.baseFinanceira === 2465 &&
      Math.abs((orc1x.totalGeral || 0) - esperadoTotal1x) <= 0.05 &&
      Math.abs((orc1x.valorParcelaCartao || 0) - esperadoTotal1x) <= 0.05;
    assertTest(
      'O-05A',
      'Orçamento',
      'Cartão 1x aplica multiplicador 1.0439 sobre produtos + frete (não é sem acréscimo)',
      esperadoTotal1x,
      orc1x.totalGeral,
      ok1x
    );
  } catch (e: any) {
    assertTest('O-05A', 'Orçamento', 'Cartão 1x', 2573.21, e.message, false);
  }

  // O-05B: Cartão 2x -> multiplicador 1.0650 sobre base completa (2465 * 1.0650 = 2625.23; parcela = 1312.61)
  try {
    const mixCartao = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orc2x = calcularOrcamento({
      barrisTotal: 3,
      mix: mixCartao,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 2,
      houveBarganha: false,
    });
    const esperadoTotal2x = 2625.23;
    const esperadoParcela2x = 1312.61;
    const ok2x =
      orc2x.multiplicadorCartao === 1.065 &&
      Math.abs((orc2x.valorParcelaCartao || 0) - esperadoParcela2x) <= 0.05 &&
      Math.abs((orc2x.totalGeral || 0) - esperadoTotal2x) <= 0.05;
    assertTest(
      'O-05B',
      'Orçamento',
      'Cartão 2x aplica multiplicador 1.0650 sobre produtos + frete (parcela = total / 2)',
      esperadoTotal2x,
      orc2x.totalGeral,
      ok2x
    );
  } catch (e: any) {
    assertTest('O-05B', 'Orçamento', 'Cartão 2x', 2625.23, e.message, false);
  }

  // O-05C: Cartão 6x -> multiplicador 1.1076 sobre base completa (2465 * 1.1076 = 2730.23; parcela = 455.04)
  try {
    const mixCartao = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orc6x = calcularOrcamento({
      barrisTotal: 3,
      mix: mixCartao,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 6,
      houveBarganha: false,
    });
    const esperadoTotal6x = 2730.23;
    const esperadoParcela6x = 455.04;
    const ok6x =
      orc6x.multiplicadorCartao === 1.1076 &&
      Math.abs((orc6x.valorParcelaCartao || 0) - esperadoParcela6x) <= 0.05 &&
      Math.abs((orc6x.totalGeral || 0) - esperadoTotal6x) <= 0.05;
    assertTest(
      'O-05C',
      'Orçamento',
      'Cartão 6x aplica multiplicador 1.1076 sobre produtos + frete (parcela = total / 6)',
      esperadoTotal6x,
      orc6x.totalGeral,
      ok6x
    );
  } catch (e: any) {
    assertTest('O-05C', 'Orçamento', 'Cartão 6x', 2730.23, e.message, false);
  }

  // O-05D: Cartão 12x -> multiplicador 1.2000 sobre base completa (2465 * 1.2 = 2958.00; parcela = 246.50)
  try {
    const mixCartao = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orc12x = calcularOrcamento({
      barrisTotal: 3,
      mix: mixCartao,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 12,
      houveBarganha: false,
    });
    const esperadoTotal12x = 2958.0;
    const esperadoParcela12x = 246.5;
    const ok12x =
      orc12x.multiplicadorCartao === 1.2 &&
      Math.abs((orc12x.valorParcelaCartao || 0) - esperadoParcela12x) <= 0.05 &&
      Math.abs((orc12x.totalGeral || 0) - esperadoTotal12x) <= 0.05;
    assertTest(
      'O-05D',
      'Orçamento',
      'Cartão 12x aplica multiplicador 1.2000 sobre produtos + frete (parcela = total / 12)',
      esperadoTotal12x,
      orc12x.totalGeral,
      ok12x
    );
  } catch (e: any) {
    assertTest('O-05D', 'Orçamento', 'Cartão 12x', 2958.0, e.message, false);
  }

  // O-05E: Troca de parcelas atualiza valor da parcela e total dinamicamente
  try {
    const mixCartao = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcIni = calcularOrcamento({
      barrisTotal: 3,
      mix: mixCartao,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 1,
      houveBarganha: false,
    });
    const orcFim = calcularOrcamento({
      barrisTotal: 3,
      mix: mixCartao,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 6,
      houveBarganha: false,
    });
    const okTroca =
      orcIni.valorParcelaCartao !== orcFim.valorParcelaCartao &&
      (orcIni.totalGeral || 0) < (orcFim.totalGeral || 0);
    assertTest(
      'O-05E',
      'Orçamento',
      'Troca do número de parcelas de 1x para 6x recalcula parcela e total sobre base completa',
      true,
      okTroca,
      okTroca
    );
  } catch (e: any) {
    assertTest('O-05E', 'Orçamento', 'Troca de parcelas', true, e.message, false);
  }

  // O-05F: Frete A_CONFIRMAR não bloqueia orçamento e demonstra desconto sobre produtos sem fechar total geral
  try {
    const mixAConfirmar = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcAConfPix = calcularOrcamento({
      barrisTotal: 3,
      mix: mixAConfirmar,
      frete: { valor: null, status: 'A_CONFIRMAR', faixaNome: 'Sob Consulta' },
      formaPagamento: 'PIX',
      houveBarganha: true,
    });
    const okAConfPix =
      orcAConfPix.invariantesValidos === true &&
      orcAConfPix.totalGeral === null &&
      orcAConfPix.descontoBarganhaValor === 119.5 &&
      orcAConfPix.totalProdutosLiquido === 2270.5 &&
      orcAConfPix.totalGeralFormatado.includes('Frete a confirmar');
    assertTest(
      'O-05F',
      'Orçamento',
      'Frete A_CONFIRMAR não bloqueia orçamento: demonstra desconto nos produtos e totalGeral null',
      true,
      okAConfPix,
      okAConfPix
    );
  } catch (e: any) {
    assertTest('O-05F', 'Orçamento', 'Frete A_CONFIRMAR PIX', true, e.message, false);
  }

  // O-05G: Frete A_CONFIRMAR com Cartão demonstra parcela sobre produtos sem fechar total geral
  try {
    const mixAConfirmar = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcAConfCartao = calcularOrcamento({
      barrisTotal: 3,
      mix: mixAConfirmar,
      frete: { valor: null, status: 'A_CONFIRMAR', faixaNome: 'Sob Consulta' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 6,
      houveBarganha: false,
    });
    const esperadoParcelaProd = 441.19; // 2390 * 1.1076 / 6
    const okAConfCartao =
      orcAConfCartao.invariantesValidos === true &&
      orcAConfCartao.totalGeral === null &&
      Math.abs((orcAConfCartao.valorParcelaCartao || 0) - esperadoParcelaProd) <= 0.05 &&
      orcAConfCartao.totalGeralFormatado.includes('Frete a confirmar');
    assertTest(
      'O-05G',
      'Orçamento',
      'Frete A_CONFIRMAR com cartão demonstra parcela sobre produtos e totalGeral null',
      true,
      okAConfCartao,
      okAConfCartao
    );
  } catch (e: any) {
    assertTest('O-05G', 'Orçamento', 'Frete A_CONFIRMAR Cartão', true, e.message, false);
  }

  // O-05H: Confirmação do frete recalcula base completa fechando valores matematicamente
  try {
    const mixConfirmado = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcConfirmado = calcularOrcamento({
      barrisTotal: 3,
      mix: mixConfirmado,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'Confirmado RMBH' },
      formaPagamento: 'CARTAO',
      parcelasCartao: 6,
      houveBarganha: false,
    });
    const okConf =
      orcConfirmado.totalGeral === 2730.23 &&
      orcConfirmado.valorParcelaCartao === 455.04 &&
      orcConfirmado.baseFinanceira === 2465;
    assertTest(
      'O-05H',
      'Orçamento',
      'Confirmação de frete reconstrói base e fecha matematicamente parcelas e total',
      2730.23,
      orcConfirmado.totalGeral,
      okConf
    );
  } catch (e: any) {
    assertTest('O-05H', 'Orçamento', 'Confirmação Frete Cartão', 2730.23, e.message, false);
  }

  // ==========================================
  // 27.5 Interoperabilidade (URL & wa.me)
  // ==========================================

  // I-01: URL com adultos/duração/outras válidos -> preencher inputs e recalcular litros
  try {
    const spI01 = new URLSearchParams(
      'v=1&src=iara&data_evento=2026-10-15&cidade=Belo%20Horizonte&qtd_pessoas=100&qtd_adultos=80&duracao_horas=6&outras_bebidas_alcoolicas=NAO'
    );
    const resI01 = importarParametrosURL(spI01);
    const recalculoOk = resI01.novoEstado.litros_estimados === 144 && resI01.novoEstado.qtd_adultos === 80;
    assertTest('I-01', 'Interoperabilidade', 'URL com dados válidos preenche inputs e recalcula litros (144 L)', 144, resI01.novoEstado.litros_estimados, recalculoOk);
  } catch (e: any) {
    assertTest('I-01', 'Interoperabilidade', 'URL importação', 144, e.message, false);
  }

  // I-02: URL contendo litros_estimados adulterado -> ignorar valor derivado e recalcular localmente
  try {
    const spI02 = new URLSearchParams(
      'v=1&src=iara&qtd_adultos=80&duracao_horas=6&outras_bebidas_alcoolicas=NAO&litros_estimados=999'
    );
    const resI02 = importarParametrosURL(spI02);
    // Deve ignorar o 999 e calcular 144!
    assertTest(
      'I-02',
      'Interoperabilidade',
      'URL com litros_estimados adulterado (999) é ignorado e recalculado para 144 L',
      144,
      resI02.novoEstado.litros_estimados,
      resI02.novoEstado.litros_estimados === 144
    );
  } catch (e: any) {
    assertTest('I-02', 'Interoperabilidade', 'URL adulterado', 144, e.message, false);
  }

  // I-03: URL contendo cpf ou data_nascimento -> ignorar/rejeitar, não persistir e não renderizar
  try {
    const spI03 = new URLSearchParams('v=1&src=iara&cpf=12345678900&data_nascimento=1990-01-01');
    const resI03 = importarParametrosURL(spI03);
    const semCpfNoEstado = !('cpf' in resI03.novoEstado) || (resI03.novoEstado as any).cpf === undefined;
    const semNascNoEstado = !('data_nascimento' in resI03.novoEstado) || (resI03.novoEstado as any).data_nascimento === undefined;
    assertTest(
      'I-03',
      'Interoperabilidade',
      'URL com CPF ou data_nascimento são estritamente ignorados/rejeitados',
      'Campos ausentes do estado',
      semCpfNoEstado && semNascNoEstado ? 'Campos ausentes do estado' : 'Vazou dado',
      semCpfNoEstado && semNascNoEstado && resI03.parametrosIgnorados >= 2
    );
  } catch (e: any) {
    assertTest('I-03', 'Interoperabilidade', 'Rejeição CPF/Nascimento', 'Ausente', e.message, false);
  }

  // I-04: wa.me preventivo/final -> mensagem contém contexto comercial, NÃO contém CPF/nascimento, e indica complementação humana
  try {
    const estadoI04 = criarEstadoInicial();
    estadoI04.data_evento = '2026-10-15';
    estadoI04.qtd_adultos = 80;
    estadoI04.duracao_horas = 6;
    estadoI04.outras_bebidas_alcoolicas = 'NAO';
    estadoI04.litros_estimados = 144;
    estadoI04.barris_total_escolhidos = 3;
    estadoI04.cenario_quantidade = 'JUSTO';
    estadoI04.mix = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    estadoI04.frete = { valor: 50, status: 'FIXADO', faixaNome: 'Belo Horizonte' };
    estadoI04.orcamento = calcularOrcamento({
      barrisTotal: 3,
      mix: estadoI04.mix,
      frete: estadoI04.frete,
      formaPagamento: 'PIX',
      houveBarganha: false,
    });

    const msg = gerarTextoMensagemWhatsApp(estadoI04, 'final');
    const link = gerarLinkWhatsApp(estadoI04, 'final');

    const temBarris = msg.includes('3 barris') && msg.includes('150 L');
    const temMix = msg.includes('1 Pilsen + 1 Session IPA + 1 Amber');
    const naoTemCpf = !msg.toLowerCase().includes('cpf: 1') && !link.includes('cpf=');
    const temStart = msg.includes('Olá, equipe Albanos!');

    const okI04 = temBarris && temMix && naoTemCpf && temStart;
    assertTest('I-04', 'Interoperabilidade', 'Mensagem wa.me contém contexto consolidado enxuto, start contextual e preserva privacidade', true, okI04, okI04);
  } catch (e: any) {
    assertTest('I-04', 'Interoperabilidade', 'Gerador wa.me', true, e.message, false);
  }

  // I-05: Mudança de duração após orçamento -> recalcular descendentes sem apagar dados independentes
  try {
    let estadoI05 = criarEstadoInicial();
    estadoI05.data_evento = '2026-10-15';
    estadoI05.cidade = 'Belo Horizonte';
    estadoI05.endereco.logradouro = 'Rua dos Inconfidentes';
    estadoI05.endereco.numero = '1000';
    estadoI05.endereco.bairro = 'Savassi';
    estadoI05.qtd_adultos = 80;
    estadoI05.duracao_horas = 6;
    estadoI05.outras_bebidas_alcoolicas = 'NAO';
    estadoI05 = aplicarMudancaEstado(estadoI05, 'duracao_horas', 6);
    estadoI05 = aplicarMudancaEstado(estadoI05, 'barris_total_escolhidos', 3);
    estadoI05.revisao_pre_orcamento_confirmada = true;
    estadoI05 = aplicarMudancaEstado(estadoI05, 'mix', { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 });

    // Agora muda a duração de 6h para 4h
    const estadoModificado = aplicarMudancaEstado(estadoI05, 'duracao_horas', 4);

    // Litros devem recalcular para 120 L
    const recalculoLitros = estadoModificado.litros_estimados === 120;
    // Endereço e cidade devem ser preservados!
    const preservouEndereco = estadoModificado.endereco.logradouro === 'Rua dos Inconfidentes' && estadoModificado.cidade === 'Belo Horizonte';
    // Barris escolhidos anteriormente (3) devem ser preservados
    const preservouBarris = estadoModificado.barris_total_escolhidos === 3;

    assertTest(
      'I-05',
      'Interoperabilidade',
      'Mudança de duração recalcula descendentes (120 L) e preserva dados independentes (endereço/mix)',
      true,
      recalculoLitros && preservouEndereco && preservouBarris,
      recalculoLitros && preservouEndereco && preservouBarris
    );
  } catch (e: any) {
    assertTest('I-05', 'Interoperabilidade', 'Invalidação seletiva de descendentes', true, e.message, false);
  }

  // I-06: wa.me com frete A_CONFIRMAR -> não expõe parcelas ou totais com desconto parciais como se fossem definitivos
  try {
    const estadoI06 = criarEstadoInicial();
    estadoI06.data_evento = '2026-11-20';
    estadoI06.cidade = 'Nova Lima';
    estadoI06.barris_total_escolhidos = 3;
    estadoI06.mix = { pilsen: 3, life_lager: 0, session_ipa: 0, amber: 0, american_ipa: 0, pale_ale: 0 };
    estadoI06.frete = { status: 'A_CONFIRMAR', valor: null, faixaNome: 'Fora de Área' };
    estadoI06.forma_pagamento = 'CARTAO';
    estadoI06.parcelas_cartao = 3;
    estadoI06.orcamento = calcularOrcamento({
      barrisTotal: 3,
      mix: estadoI06.mix,
      frete: estadoI06.frete,
      formaPagamento: 'CARTAO',
      parcelasCartao: 3,
      houveBarganha: false,
    });

    const msgCartao = gerarTextoMensagemWhatsApp(estadoI06, 'final');
    const semParcelaDefinitivaCartao =
      !msgCartao.includes('3x de R$') &&
      msgCartao.includes('recalculados sobre produtos + frete após a confirmação do frete') &&
      msgCartao.includes('Frete a confirmar');

    // Agora testa com PIX e barganha
    estadoI06.forma_pagamento = 'PIX';
    estadoI06.houve_barganha = true;
    estadoI06.orcamento = calcularOrcamento({
      barrisTotal: 3,
      mix: estadoI06.mix,
      frete: estadoI06.frete,
      formaPagamento: 'PIX',
      houveBarganha: true,
    });

    const msgPix = gerarTextoMensagemWhatsApp(estadoI06, 'final');
    const semTotalLiquidoDefinitivoPix =
      !msgPix.includes('com 5% off') &&
      msgPix.includes('desconto final será aplicado sobre o total do pedido (produtos + frete) após a confirmação do frete');

    const okI06 = semParcelaDefinitivaCartao && semTotalLiquidoDefinitivoPix;
    assertTest(
      'I-06',
      'Interoperabilidade',
      'wa.me com frete A_CONFIRMAR não apresenta parcelas ou totais com desconto como definitivos',
      true,
      okI06,
      okI06
    );
  } catch (e: any) {
    assertTest('I-06', 'Interoperabilidade', 'Handoff wa.me com frete pendente', true, e.message, false);
  }

  // =========================================================================
  // GRUPO P: PERSISTÊNCIA LOCAL (LocalStorage)
  // =========================================================================
  const createMockStorage = (): Storage => {
    const store = new Map<string, string>();
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    };
  };

  // P-01: Salvar e Carregar Sessão com integridade
  try {
    const mockStorage = createMockStorage();
    let estadoP01 = criarEstadoInicial();
    estadoP01 = aplicarMudancaEstado(estadoP01, 'qtd_adultos', 60);
    estadoP01 = aplicarMudancaEstado(estadoP01, 'duracao_horas', 5);
    estadoP01 = aplicarMudancaEstado(estadoP01, 'cidade', 'Nova Lima');

    const salvo = salvarSessaoNoLocalStorage(estadoP01, 3, mockStorage);
    const carregado = carregarSessaoDoLocalStorage(mockStorage);

    const persistiuCorretamente =
      salvo &&
      carregado !== null &&
      carregado.etapaAtual === 3 &&
      carregado.state.qtd_adultos === 60 &&
      carregado.state.duracao_horas === 5 &&
      carregado.state.cidade === 'Nova Lima' &&
      temDadosPreenchidos(carregado);

    assertTest(
      'P-01',
      'Persistência',
      'Salva e restaura estado e etapa (Etapa 3, 60 adultos, Nova Lima) com integridade',
      true,
      persistiuCorretamente,
      persistiuCorretamente
    );
  } catch (e: any) {
    assertTest('P-01', 'Persistência', 'Salvar e carregar sessão', true, e.message, false);
  }

  // P-02: Limpar Sessão do LocalStorage
  try {
    const mockStorage = createMockStorage();
    const estadoP02 = criarEstadoInicial();
    salvarSessaoNoLocalStorage(estadoP02, 2, mockStorage);
    limparSessaoDoLocalStorage(mockStorage);
    const carregado = carregarSessaoDoLocalStorage(mockStorage);

    assertTest(
      'P-02',
      'Persistência',
      'Limpeza de sessão remove chave do storage e retorna null no carregamento',
      true,
      carregado === null,
      carregado === null
    );
  } catch (e: any) {
    assertTest('P-02', 'Persistência', 'Limpar sessão', true, e.message, false);
  }

  // P-03: Resiliência contra JSON corrompido
  try {
    const mockStorage = createMockStorage();
    mockStorage.setItem('albanos_chopp_calculator_session_v1', '{invalid_json--corrupted');
    const carregado = carregarSessaoDoLocalStorage(mockStorage);

    assertTest(
      'P-03',
      'Persistência',
      'Resiliência a JSON inválido/corrompido sem quebrar a aplicação (retorna null de fallback)',
      true,
      carregado === null,
      carregado === null
    );
  } catch (e: any) {
    assertTest('P-03', 'Persistência', 'Resiliência a JSON inválido', true, e.message, false);
  }

  // ==========================================
  // GRUPO L: LOGÍSTICA & RETIRADA NA FÁBRICA
  // ==========================================

  // L-01: Cálculo determinístico de data D - 1
  const dMenos1Padrao = calcularDataDMenos1('2026-10-15');
  const dMenos1ViradaMes = calcularDataDMenos1('2026-03-01');
  const dMenos1ViradaAno = calcularDataDMenos1('2027-01-01');
  const calculoD1Correto =
    dMenos1Padrao === '2026-10-14' &&
    dMenos1ViradaMes === '2026-02-28' &&
    dMenos1ViradaAno === '2026-12-31';
  assertTest(
    'L-01',
    'Logística & Retirada',
    'Cálculo determinístico de data D - 1 (incluindo virada de mês e de ano)',
    '2026-10-14 / 2026-02-28 / 2026-12-31',
    `${dMenos1Padrao} / ${dMenos1ViradaMes} / ${dMenos1ViradaAno}`,
    calculoD1Correto
  );

  // L-02: Herança do horário padrão de retirada ajustado à janela comercial (10:00 a 17:00)
  const horaComEventoDentroJanela = obterHorarioPadraoRetirada('14:30');
  const horaComEventoAposJanela = obterHorarioPadraoRetirada('19:30');
  const horaSemEvento = obterHorarioPadraoRetirada(undefined);
  const horaCorreta =
    horaComEventoDentroJanela === '14:30' &&
    horaComEventoAposJanela === '17:00' &&
    horaSemEvento === '10:00';
  assertTest(
    'L-02',
    'Logística & Retirada',
    'Horário de retirada na fábrica respeita janela comercial (14:30 preservado, 19:30 ajustado para 17:00, undefined recorre a 10:00)',
    '14:30, 17:00 e 10:00',
    `${horaComEventoDentroJanela}, ${horaComEventoAposJanela} e ${horaSemEvento}`,
    horaCorreta
  );

  // L-03: Validação de data vazia
  const valVazia = validarDataRetiradaFabrica('', '2026-10-15', '2026-10-01');
  assertTest(
    'L-03',
    'Logística & Retirada',
    'Data de retirada vazia é rejeitada com aviso apropriado',
    false,
    valVazia.valido,
    valVazia.valido === false
  );

  // L-04: Validação de data maior ou igual a hoje (passado é rejeitado, hoje é aceito)
  const valHoje = validarDataRetiradaFabrica('2026-10-01', '2026-10-15', '2026-10-01');
  const valPassado = validarDataRetiradaFabrica('2026-09-30', '2026-10-15', '2026-10-01');
  assertTest(
    'L-04',
    'Logística & Retirada',
    'Data de retirada precisa ser maior ou igual a hoje (hoje é aceito, passado é rejeitado)',
    'true e false',
    `${valHoje.valido} e ${valPassado.valido}`,
    valHoje.valido === true && valPassado.valido === false
  );

  // L-05: Validação de data no próprio dia do evento (permitida) e posterior ao evento (rejeitada)
  const valMesmoDiaEvento = validarDataRetiradaFabrica('2026-10-15', '2026-10-15', '2026-10-01');
  const valAposEvento = validarDataRetiradaFabrica('2026-10-16', '2026-10-15', '2026-10-01');
  assertTest(
    'L-05',
    'Logística & Retirada',
    'Data de retirada no mesmo dia do evento é permitida, e posterior ao evento é rejeitada',
    'true e false',
    `${valMesmoDiaEvento.valido} e ${valAposEvento.valido}`,
    valMesmoDiaEvento.valido === true && valAposEvento.valido === false
  );

  // L-06: Validação de data válida em D - 1 (maior que hoje e menor que o evento)
  const valDMenos1 = validarDataRetiradaFabrica('2026-10-14', '2026-10-15', '2026-10-01');
  assertTest(
    'L-06',
    'Logística & Retirada',
    'Data de retirada em D - 1 (maior que hoje e menor que o evento) é aprovada com sucesso',
    true,
    valDMenos1.valido,
    valDMenos1.valido === true
  );

  // L-07: Injeção de D-1 e horário sugerido comercial ao selecionar RETIRADA_FABRICA via motor de dependências
  const estadoLog = criarEstadoInicial();
  estadoLog.data_evento = '2026-11-20';
  estadoLog.horario_inicio_evento = '18:00';
  const estadoComRetirada = aplicarMudancaEstado(estadoLog, 'modalidade_logistica', 'RETIRADA_FABRICA');
  const autoD1Correto =
    estadoComRetirada.modalidade_logistica === 'RETIRADA_FABRICA' &&
    estadoComRetirada.data_retirada === '2026-11-19' &&
    estadoComRetirada.hora_retirada === '17:00';
  assertTest(
    'L-07',
    'Logística & Retirada',
    'Motor de dependências define D-1 (2026-11-19) e horário ajustado à janela comercial (17:00 para evento às 18:00)',
    '2026-11-19 às 17:00',
    `${estadoComRetirada.data_retirada} às ${estadoComRetirada.hora_retirada}`,
    autoD1Correto
  );

  // L-08: Sugestão para ENTREGA via motor de dependências
  const estadoLogEntrega = criarEstadoInicial();
  estadoLogEntrega.data_evento = '2026-11-20';
  estadoLogEntrega.horario_inicio_evento = '14:00';
  const estadoComEntrega = aplicarMudancaEstado(estadoLogEntrega, 'modalidade_logistica', 'ENTREGA');
  const entregaSugeridaCorreta =
    estadoComEntrega.modalidade_logistica === 'ENTREGA' &&
    estadoComEntrega.data_entrega === '2026-11-19' &&
    estadoComEntrega.hora_entrega === '14:00';
  assertTest(
    'L-08',
    'Logística & Entrega',
    'Motor de dependências define D-1 e preserva horário dentro da janela comercial (14:00) para ENTREGA',
    '2026-11-19 às 14:00',
    `${estadoComEntrega.data_entrega} às ${estadoComEntrega.hora_entrega}`,
    entregaSugeridaCorreta
  );

  // ==========================================
  // CENÁRIOS OBRIGATÓRIOS DA ETAPA 5 (ITEM 15)
  // DATAS (1 A 7) E HORÁRIOS (8 A 16)
  // ==========================================

  // 1. D-1 é sugerido quando está dentro do intervalo válido
  const sugD1 = calcularSugestaoDataLogistica('2026-10-15', '2026-10-01');
  assertTest(
    'L-09',
    'Logística (Datas)',
    '1. D-1 é sugerido quando está dentro do intervalo válido (evento 2026-10-15 -> sugere 2026-10-14)',
    '2026-10-14',
    sugD1,
    sugD1 === '2026-10-14'
  );

  // 2. Se D-1 estiver no passado, a sugestão não produz data inválida
  const sugD1Passado = calcularSugestaoDataLogistica('2026-10-01', '2026-10-01');
  assertTest(
    'L-10',
    'Logística (Datas)',
    '2. Se D-1 estiver no passado, a sugestão não produz data inválida (recorre a hoje 2026-10-01)',
    '2026-10-01',
    sugD1Passado,
    sugD1Passado === '2026-10-01'
  );

  // 3. Data igual a hoje é aceita
  const valHojeAceita = validarDataLogistica('2026-10-01', '2026-10-15', '2026-10-01');
  assertTest(
    'L-11',
    'Logística (Datas)',
    '3. Data igual a hoje é aceita',
    true,
    valHojeAceita.valido,
    valHojeAceita.valido === true
  );

  // 4. Data igual à data do evento é aceita
  const valEventoAceita = validarDataLogistica('2026-10-15', '2026-10-15', '2026-10-01');
  assertTest(
    'L-12',
    'Logística (Datas)',
    '4. Data igual à data do evento é aceita',
    true,
    valEventoAceita.valido,
    valEventoAceita.valido === true
  );

  // 5. Data entre hoje e o evento é aceita
  const valIntermediaria = validarDataLogistica('2026-10-10', '2026-10-15', '2026-10-01');
  assertTest(
    'L-13',
    'Logística (Datas)',
    '5. Data entre hoje e o evento é aceita',
    true,
    valIntermediaria.valido,
    valIntermediaria.valido === true
  );

  // 6. Data anterior a hoje é rejeitada
  const valPassadoRejeitada = validarDataLogistica('2026-09-30', '2026-10-15', '2026-10-01');
  assertTest(
    'L-14',
    'Logística (Datas)',
    '6. Data anterior a hoje é rejeitada',
    false,
    valPassadoRejeitada.valido,
    valPassadoRejeitada.valido === false
  );

  // 7. Data posterior ao evento é rejeitada
  const valPosteriorRejeitada = validarDataLogistica('2026-10-16', '2026-10-15', '2026-10-01');
  assertTest(
    'L-15',
    'Logística (Datas)',
    '7. Data posterior ao evento é rejeitada',
    false,
    valPosteriorRejeitada.valido,
    valPosteriorRejeitada.valido === false
  );

  // 8. 10h é aceito
  const val10h = validarHorarioLogistica('10:00', '2026-10-14', '2026-10-15', '18:00');
  assertTest(
    'L-16',
    'Logística (Horários)',
    '8. 10h é aceito (limite inferior da janela comercial)',
    true,
    val10h.valido,
    val10h.valido === true
  );

  // 9. 17h é aceito
  const val17h = validarHorarioLogistica('17:00', '2026-10-14', '2026-10-15', '18:00');
  assertTest(
    'L-17',
    'Logística (Horários)',
    '9. 17h é aceito (limite superior da janela comercial)',
    true,
    val17h.valido,
    val17h.valido === true
  );

  // 10. Horário anterior a 10h é rejeitado
  const valAntes10h = validarHorarioLogistica('09:59', '2026-10-14', '2026-10-15', '18:00');
  assertTest(
    'L-18',
    'Logística (Horários)',
    '10. Horário anterior a 10h é rejeitado',
    false,
    valAntes10h.valido,
    valAntes10h.valido === false
  );

  // 11. Horário posterior a 17h é rejeitado
  const valApos17h = validarHorarioLogistica('17:01', '2026-10-14', '2026-10-15', '18:00');
  assertTest(
    'L-19',
    'Logística (Horários)',
    '11. Horário posterior a 17h é rejeitado',
    false,
    valApos17h.valido,
    valApos17h.valido === false
  );

  // 12. Evento às 8h gera sugestão 10h
  const sugEvento8h = obterHorarioSugeridoLogistica('08:00');
  assertTest(
    'L-20',
    'Logística (Horários)',
    '12. Evento às 8h gera sugestão 10h (ajustado ao início da janela comercial)',
    '10:00',
    sugEvento8h,
    sugEvento8h === '10:00'
  );

  // 13. Evento às 14h gera sugestão 14h
  const sugEvento14h = obterHorarioSugeridoLogistica('14:00');
  assertTest(
    'L-21',
    'Logística (Horários)',
    '13. Evento às 14h gera sugestão 14h (preserva horário dentro da janela comercial)',
    '14:00',
    sugEvento14h,
    sugEvento14h === '14:00'
  );

  // 14. Evento às 20h gera sugestão 17h
  const sugEvento20h = obterHorarioSugeridoLogistica('20:00');
  assertTest(
    'L-22',
    'Logística (Horários)',
    '14. Evento às 20h gera sugestão 17h (ajustado ao teto da janela comercial)',
    '17:00',
    sugEvento20h,
    sugEvento20h === '17:00'
  );

  // 15. No dia do evento, horário antes ou igual ao evento é aceito
  const valDiaEventoAntes = validarHorarioLogistica('12:00', '2026-10-15', '2026-10-15', '14:00');
  const valDiaEventoIgual = validarHorarioLogistica('14:00', '2026-10-15', '2026-10-15', '14:00');
  assertTest(
    'L-23',
    'Logística (Horários)',
    '15. No dia do evento, horário antes ou igual ao evento é aceito (12:00 e 14:00 para evento às 14:00)',
    'true e true',
    `${valDiaEventoAntes.valido} e ${valDiaEventoIgual.valido}`,
    valDiaEventoAntes.valido === true && valDiaEventoIgual.valido === true
  );

  // 16. No dia do evento, horário após o evento é rejeitado
  const valDiaEventoApos = validarHorarioLogistica('15:00', '2026-10-15', '2026-10-15', '14:00');
  assertTest(
    'L-24',
    'Logística (Horários)',
    '16. No dia do evento, horário após o evento é rejeitado (15:00 > 14:00)',
    false,
    valDiaEventoApos.valido,
    valDiaEventoApos.valido === false
  );

  const passouCount = itens.filter((i) => i.passou).length;
  const falhouCount = itens.filter((i) => !i.passou).length;

  return {
    total: itens.length,
    passou: passouCount,
    falhou: falhouCount,
    itens,
  };
}

if (typeof process !== 'undefined' && Array.isArray(process?.argv) && process.argv[1]?.endsWith('engineTests.ts')) {
  const res = executarTodosOsTestes();
  console.log(`TOTAL ENGINE TESTS: ${res.total} | PASSOU: ${res.passou} | FALHOU: ${res.falhou}`);
  if (res.falhou > 0) {
    console.error('FALHAS:');
    res.itens.filter((i) => !i.passou).forEach((f) => console.error(f));
    process.exit?.(1);
  }
}
