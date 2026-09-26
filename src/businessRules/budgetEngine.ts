/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Motor Determinístico de Orçamento e Precificação V1.1
 */

import {
  EstiloChope,
  FormaPagamento,
  FreteResultado,
  MixBarris,
  OrcamentoDetalhado,
  OrcamentoSubtotalEstilo,
} from '../types';
import {
  ALCADA_DESCONTO_BARGANHA_PERCENTUAL,
  BARRIL_VOLUME_LITROS,
  MULTIPLICADORES_CARTAO,
  PORTFOLIO_ESTILOS,
} from './domainConfig';
import { somarBarrisMix, validarInvarianteMix } from './mixEngine';

export interface ParametrosOrcamento {
  barrisTotal: number;
  mix: MixBarris;
  frete: FreteResultado;
  formaPagamento: FormaPagamento;
  parcelasCartao?: number;
  houveBarganha: boolean;
}

/**
 * Formata valores monetários em formato padrão BRL (R$ 1.234,56).
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Executa o pipeline determinístico do orçamento:
 * 1. Validação de invariantes
 * 2. Cálculo dos subtotais por estilo
 * 3. Soma dos produtos
 * 4. Verificação independente de soma
 * 5. Aplicação de desconto de barganha autorizado (5% só para PIX/DINHEIRO, somente sobre produtos)
 * 6. Aplicação de multiplicador de cartão (somente sobre produtos)
 * 7. Soma do frete (sem desconto, sem juros)
 * 8. Checagem final de consistência
 */
export function calcularOrcamento(
  params: ParametrosOrcamento
): OrcamentoDetalhado {
  const {
    barrisTotal,
    mix,
    frete,
    formaPagamento,
    parcelasCartao = 1,
    houveBarganha,
  } = params;

  // Invariante 1: total de barris deve ser inteiro positivo
  if (!barrisTotal || barrisTotal <= 0 || !Number.isInteger(barrisTotal)) {
    return {
      barrisTotal: barrisTotal || 0,
      litrosComerciais: 0,
      itens: [],
      totalProdutosBruto: 0,
      descontoBarganhaValor: 0,
      descontoAplicado: false,
      totalProdutosLiquido: 0,
      frete,
      formaPagamento,
      totalGeral: null,
      totalGeralFormatado: 'R$ 0,00',
      invariantesValidos: false,
      motivoBloqueio: 'Quantidade de barris deve ser um número inteiro positivo.',
    };
  }

  // Invariante 2: validação da soma do mix
  const validacaoMix = validarInvarianteMix(mix, barrisTotal);
  if (!validacaoMix.valido) {
    return {
      barrisTotal,
      litrosComerciais: barrisTotal * BARRIL_VOLUME_LITROS,
      itens: [],
      totalProdutosBruto: 0,
      descontoBarganhaValor: 0,
      descontoAplicado: false,
      totalProdutosLiquido: 0,
      frete,
      formaPagamento,
      totalGeral: null,
      totalGeralFormatado: 'R$ 0,00',
      invariantesValidos: false,
      motivoBloqueio: validacaoMix.mensagem || 'Mix de estilos inconsistente.',
    };
  }

  // Subtotais por estilo
  const itens: OrcamentoSubtotalEstilo[] = [
    {
      estilo: 'pilsen' as EstiloChope,
      nome: PORTFOLIO_ESTILOS.pilsen.nome,
      barris: mix.pilsen || 0,
      precoUnitario: PORTFOLIO_ESTILOS.pilsen.precoUnitario,
      subtotal: (mix.pilsen || 0) * PORTFOLIO_ESTILOS.pilsen.precoUnitario,
    },
    {
      estilo: 'life_lager' as EstiloChope,
      nome: PORTFOLIO_ESTILOS.life_lager.nome,
      barris: mix.life_lager || 0,
      precoUnitario: PORTFOLIO_ESTILOS.life_lager.precoUnitario,
      subtotal: (mix.life_lager || 0) * PORTFOLIO_ESTILOS.life_lager.precoUnitario,
    },
    {
      estilo: 'session_ipa' as EstiloChope,
      nome: PORTFOLIO_ESTILOS.session_ipa.nome,
      barris: mix.session_ipa || 0,
      precoUnitario: PORTFOLIO_ESTILOS.session_ipa.precoUnitario,
      subtotal: (mix.session_ipa || 0) * PORTFOLIO_ESTILOS.session_ipa.precoUnitario,
    },
    {
      estilo: 'amber' as EstiloChope,
      nome: PORTFOLIO_ESTILOS.amber.nome,
      barris: mix.amber || 0,
      precoUnitario: PORTFOLIO_ESTILOS.amber.precoUnitario,
      subtotal: (mix.amber || 0) * PORTFOLIO_ESTILOS.amber.precoUnitario,
    },
    {
      estilo: 'american_ipa' as EstiloChope,
      nome: PORTFOLIO_ESTILOS.american_ipa.nome,
      barris: mix.american_ipa || 0,
      precoUnitario: PORTFOLIO_ESTILOS.american_ipa.precoUnitario,
      subtotal: (mix.american_ipa || 0) * PORTFOLIO_ESTILOS.american_ipa.precoUnitario,
    },
    {
      estilo: 'pale_ale' as EstiloChope,
      nome: PORTFOLIO_ESTILOS.pale_ale.nome,
      barris: mix.pale_ale || 0,
      precoUnitario: PORTFOLIO_ESTILOS.pale_ale.precoUnitario,
      subtotal: (mix.pale_ale || 0) * PORTFOLIO_ESTILOS.pale_ale.precoUnitario,
    },
  ].filter((item) => item.barris > 0);

  // Rota 1 de soma
  let totalProdutosBruto = 0;
  for (const item of itens) {
    totalProdutosBruto += item.subtotal;
  }

  // Rota 2 independente de soma (verificação cruzada)
  const somaCruzada =
    (mix.pilsen || 0) * PORTFOLIO_ESTILOS.pilsen.precoUnitario +
    (mix.life_lager || 0) * PORTFOLIO_ESTILOS.life_lager.precoUnitario +
    (mix.session_ipa || 0) * PORTFOLIO_ESTILOS.session_ipa.precoUnitario +
    (mix.amber || 0) * PORTFOLIO_ESTILOS.amber.precoUnitario +
    (mix.american_ipa || 0) * PORTFOLIO_ESTILOS.american_ipa.precoUnitario +
    (mix.pale_ale || 0) * PORTFOLIO_ESTILOS.pale_ale.precoUnitario;

  if (Math.abs(totalProdutosBruto - somaCruzada) > 0.001) {
    throw new Error('Falha de integridade na soma cruzada de produtos.');
  }

  // Desconto de barganha (5% só para PIX ou DINHEIRO, apenas sobre produtos)
  let descontoBarganhaValor = 0;
  let descontoAplicado = false;
  if (houveBarganha && (formaPagamento === 'PIX' || formaPagamento === 'DINHEIRO')) {
    descontoBarganhaValor = Number(
      (totalProdutosBruto * ALCADA_DESCONTO_BARGANHA_PERCENTUAL).toFixed(2)
    );
    descontoAplicado = true;
  }

  let totalProdutosLiquido = Number(
    (totalProdutosBruto - descontoBarganhaValor).toFixed(2)
  );

  // Regra de cartão de crédito
  let multiplicadorCartao: number | undefined;
  let valorParcelaCartao: number | undefined;
  if (formaPagamento === 'CARTAO') {
    const numParcelas = Math.min(Math.max(parcelasCartao, 1), 12);
    multiplicadorCartao = MULTIPLICADORES_CARTAO[numParcelas] || 1.0;
    // Multiplicador incide apenas sobre produtos
    totalProdutosLiquido = Number((totalProdutosBruto * multiplicadorCartao).toFixed(2));
    valorParcelaCartao = Number((totalProdutosLiquido / numParcelas).toFixed(2));
  }

  // Frete é somado após qualquer condição de produtos (frete nunca recebe desconto nem juros)
  let totalGeral: number | null = null;
  let totalGeralFormatado = '';

  if (frete.status === 'A_CONFIRMAR' || frete.valor === null) {
    totalGeral = null;
    totalGeralFormatado = `${formatarMoeda(totalProdutosLiquido)} + Frete a confirmar`;
  } else {
    totalGeral = Number((totalProdutosLiquido + frete.valor).toFixed(2));
    totalGeralFormatado = formatarMoeda(totalGeral);
  }

  return {
    barrisTotal,
    litrosComerciais: barrisTotal * BARRIL_VOLUME_LITROS,
    itens,
    totalProdutosBruto,
    descontoBarganhaValor,
    descontoAplicado,
    totalProdutosLiquido,
    frete,
    formaPagamento,
    parcelasCartao: formaPagamento === 'CARTAO' ? parcelasCartao : undefined,
    multiplicadorCartao,
    valorParcelaCartao,
    totalGeral,
    totalGeralFormatado,
    invariantesValidos: true,
  };
}
