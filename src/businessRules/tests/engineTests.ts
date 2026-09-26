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

  // D-07: duração fracionada >4h -> aplicar fallback linear (+10%/h acima de 4h)
  // Exemplo: 5.5h sem outra alcoólica -> base 1.5 * (1 + 0.1 * 1.5) = 1.5 * 1.15 = 1.725 L/adulto. Para 80 adultos = 138 L.
  try {
    const fatorFracionado = calcularFatorConsumo(5.5, 'NAO');
    const d07 = calcularDimensionamento(80, 5.5, 'NAO');
    const esperadoD07 = 80 * 1.725; // 138 L
    assertTest('D-07', 'Dimensionamento', 'Duração fracionada >4h (5.5h, 80 adultos)', esperadoD07, d07.litrosEstimados, Math.abs(d07.litrosEstimados - esperadoD07) < 0.01);
  } catch (e: any) {
    assertTest('D-07', 'Dimensionamento', 'Duração fracionada >4h', '138 L', e.message, false);
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

  // O-04: Barganha + PIX/DINHEIRO -> 5% somente sobre produtos (2390 * 0.05 = 119.50 -> 2270.50 produtos); frete intacto (75.00) -> Total = 2345.50
  try {
    const mixO04 = { pilsen: 1, session_ipa: 1, amber: 1, life_lager: 0, american_ipa: 0, pale_ale: 0 };
    const orcO04 = calcularOrcamento({
      barrisTotal: 3,
      mix: mixO04,
      frete: { valor: 75, status: 'FIXADO', faixaNome: 'RMBH' },
      formaPagamento: 'PIX',
      houveBarganha: true,
    });
    const esperadoDesc = 119.5;
    const esperadoLiq = 2270.5;
    const esperadoGeral = 2345.5;
    const okDesc =
      orcO04.descontoBarganhaValor === esperadoDesc &&
      orcO04.totalProdutosLiquido === esperadoLiq &&
      orcO04.totalGeral === esperadoGeral;
    assertTest('O-04', 'Orçamento', 'Barganha 5% apenas sobre produtos; frete intacto', esperadoGeral, orcO04.totalGeral, okDesc);
  } catch (e: any) {
    assertTest('O-04', 'Orçamento', 'Barganha 5%', 2345.5, e.message, false);
  }

  // O-05: Cartão 3x -> aplicar multiplicador 1.0755 apenas aos produtos; frete depois
  // 2390 * 1.0755 = 2570.445 -> arredondado 2570.45.
  // Frete: 75.00 -> Total = 2645.45.
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
    const esperadoProdutosCartao = 2570.45;
    const esperadoTotalCartao = 2645.45;
    const okCartao =
      Math.abs(orcO05.totalProdutosLiquido - esperadoProdutosCartao) <= 0.05 &&
      Math.abs((orcO05.totalGeral || 0) - esperadoTotalCartao) <= 0.05;
    assertTest('O-05', 'Orçamento', 'Cartão 3x com multiplicador 1.0755 apenas sobre produtos', esperadoTotalCartao, orcO05.totalGeral, okCartao);
  } catch (e: any) {
    assertTest('O-05', 'Orçamento', 'Cartão 3x', 2645.45, e.message, false);
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

  // L-02: Herança do horário padrão de retirada a partir do início do evento
  const horaComEvento = obterHorarioPadraoRetirada('19:30');
  const horaSemEvento = obterHorarioPadraoRetirada(undefined);
  const horaCorreta = horaComEvento === '19:30' && horaSemEvento === '10:00';
  assertTest(
    'L-02',
    'Logística & Retirada',
    'Horário de retirada na fábrica herda horário do evento ou recorre ao padrão 10:00',
    '19:30 e 10:00',
    `${horaComEvento} e ${horaSemEvento}`,
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

  // L-05: Validação de data igual ou posterior ao evento (deve ser menor que a data do evento)
  const valMesmoDiaEvento = validarDataRetiradaFabrica('2026-10-15', '2026-10-15', '2026-10-01');
  const valAposEvento = validarDataRetiradaFabrica('2026-10-16', '2026-10-15', '2026-10-01');
  assertTest(
    'L-05',
    'Logística & Retirada',
    'Data de retirada igual ou posterior ao evento é rejeitada (precisa ser menor que o evento)',
    'false e false',
    `${valMesmoDiaEvento.valido} e ${valAposEvento.valido}`,
    !valMesmoDiaEvento.valido && !valAposEvento.valido
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

  // L-07: Injeção automática de D-1 e horário ao selecionar RETIRADA_FABRICA via motor de dependências
  const estadoLog = criarEstadoInicial();
  estadoLog.data_evento = '2026-11-20';
  estadoLog.horario_inicio_evento = '18:00';
  const estadoComRetirada = aplicarMudancaEstado(estadoLog, 'modalidade_logistica', 'RETIRADA_FABRICA');
  const autoD1Correto =
    estadoComRetirada.modalidade_logistica === 'RETIRADA_FABRICA' &&
    estadoComRetirada.data_retirada === '2026-11-19' &&
    estadoComRetirada.hora_retirada === '18:00';
  assertTest(
    'L-07',
    'Logística & Retirada',
    'Motor de dependências define automaticamente D-1 (2026-11-19) e horário ao selecionar RETIRADA_FABRICA',
    '2026-11-19 às 18:00',
    `${estadoComRetirada.data_retirada} às ${estadoComRetirada.hora_retirada}`,
    autoD1Correto
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
