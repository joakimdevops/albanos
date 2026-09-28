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
 * 5. Determinação da Base Financeira (BASE = TOTAL_PRODUTOS + FRETE se frete conhecido)
 * 6. Aplicação de desconto de barganha/cupom de 5% sobre BASE (PIX)
 * 7. Aplicação de multiplicador de cartão sobre BASE (CARTAO), com parcelas = total / numParcelas
 * 8. Tratamento seguro para frete a confirmar (demonstração sobre valores conhecidos sem fechar total)
 * 9. Checagem final de consistência
 */
export function calcularOrcamento(
  params: ParametrosOrcamento
): OrcamentoDetalhado {
  const {
    barrisTotal,
    mix,
    frete,
    formaPagamento,
    parcelasCartao,
    houveBarganha,
  } = params;

  // Invariante 1: total de barris deve ser inteiro positivo
  if (!barrisTotal || barrisTotal <= 0 || !Number.isInteger(barrisTotal)) {
    return {
      barrisTotal: barrisTotal || 0,
      litrosComerciais: 0,
      itens: [],
      totalProdutosBruto: 0,
      baseFinanceira: 0,
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
      baseFinanceira: 0,
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

  // Identificação do status do frete
  const freteConhecido = frete.status !== 'A_CONFIRMAR' && frete.valor !== null;
  const freteValor = freteConhecido ? frete.valor! : 0;

  // Nova regra: quando o frete for conhecido, BASE = TOTAL_PRODUTOS + FRETE
  // Quando o frete for A_CONFIRMAR, a base conhecida para demonstração são apenas os produtos
  const baseFinanceira = freteConhecido
    ? Number((totalProdutosBruto + freteValor).toFixed(2))
    : totalProdutosBruto;

  let descontoBarganhaValor = 0;
  let descontoAplicado = false;
  let multiplicadorCartao: number | undefined;
  let valorParcelaCartao: number | undefined;
  let totalProdutosLiquido = totalProdutosBruto;
  let totalGeral: number | null = null;
  let totalGeralFormatado = '';

  if (formaPagamento === 'CARTAO') {
    if (!parcelasCartao || parcelasCartao < 1 || parcelasCartao > 12) {
      // Cartão sem parcelas definidas ainda: não presume 1x
      multiplicadorCartao = undefined;
      valorParcelaCartao = undefined;
      totalGeral = null;
      totalGeralFormatado = 'Selecione as parcelas';
      totalProdutosLiquido = totalProdutosBruto;
    } else {
      const numParcelas = Math.min(Math.max(parcelasCartao, 1), 12);
      multiplicadorCartao = MULTIPLICADORES_CARTAO[numParcelas] || 1.0;

      if (freteConhecido) {
        // Cartão com frete conhecido: multiplicador incide sobre a base completa (produtos + frete)
        totalGeral = Number((baseFinanceira * multiplicadorCartao).toFixed(2));
        valorParcelaCartao = Number((totalGeral / numParcelas).toFixed(2));
        totalGeralFormatado = formatarMoeda(totalGeral);
        totalProdutosLiquido = Number((totalProdutosBruto * multiplicadorCartao).toFixed(2));
      } else {
        // Cartão com frete a confirmar: demonstra condição sobre produtos sem fechar total definitivo
        const produtosAjustados = Number((totalProdutosBruto * multiplicadorCartao).toFixed(2));
        totalProdutosLiquido = produtosAjustados;
        valorParcelaCartao = Number((produtosAjustados / numParcelas).toFixed(2));
        totalGeral = null;
        totalGeralFormatado = `${formatarMoeda(produtosAjustados)} + Frete a confirmar`;
      }
    }
  } else if (houveBarganha && formaPagamento === 'PIX') {
    // PIX com cupom/barganha (5% de desconto aplicável exclusivamente a PIX)
    descontoAplicado = true;
    if (freteConhecido) {
      // 5% incide sobre a base completa (produtos + frete)
      descontoBarganhaValor = Number(
        (baseFinanceira * ALCADA_DESCONTO_BARGANHA_PERCENTUAL).toFixed(2)
      );
      totalGeral = Number((baseFinanceira - descontoBarganhaValor).toFixed(2));
      totalGeralFormatado = formatarMoeda(totalGeral);
      totalProdutosLiquido = Number(
        (totalProdutosBruto * (1 - ALCADA_DESCONTO_BARGANHA_PERCENTUAL)).toFixed(2)
      );
    } else {
      // Frete a confirmar: demonstra desconto de 5% sobre produtos conhecidos
      descontoBarganhaValor = Number(
        (totalProdutosBruto * ALCADA_DESCONTO_BARGANHA_PERCENTUAL).toFixed(2)
      );
      totalProdutosLiquido = Number(
        (totalProdutosBruto - descontoBarganhaValor).toFixed(2)
      );
      totalGeral = null;
      totalGeralFormatado = `${formatarMoeda(totalProdutosLiquido)} + Frete a confirmar`;
    }
  } else {
    // PIX sem barganha ou A_DEFINIR (condição financeiramente neutra)
    if (freteConhecido) {
      totalGeral = baseFinanceira;
      totalGeralFormatado = formatarMoeda(totalGeral);
      totalProdutosLiquido = totalProdutosBruto;
    } else {
      totalGeral = null;
      totalGeralFormatado = `${formatarMoeda(totalProdutosBruto)} + Frete a confirmar`;
      totalProdutosLiquido = totalProdutosBruto;
    }
  }

  return {
    barrisTotal,
    litrosComerciais: barrisTotal * BARRIL_VOLUME_LITROS,
    itens,
    totalProdutosBruto,
    baseFinanceira,
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
