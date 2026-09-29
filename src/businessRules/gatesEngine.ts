/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Motor Canônico de Gates e Resolução de Etapas V1.2
 *
 * Princípio:
 * Nenhuma entrada externa, deep-link ou estado intermediário pode burlar a ordem cronológica
 * estrita de etapas (1 a 8) ou os atos explícitos de decisão do usuário.
 */

import { CalculatorState } from '../types';
import { validarInvarianteMix } from './mixEngine';
import {
  validarDataLogistica,
  validarHorarioLogistica,
} from './logisticsEngine';
import {
  validarDataEvento,
  validarDuracaoHoras,
  validarGateIdentificacao,
  validarHorarioInicio,
  validarInteiroPositivoEstrito,
  validarQtdAdultos,
} from './validators';

/**
 * Determina estritamente a primeira etapa pendente (1 a 8) baseada na satisfação cumulativa dos gates.
 * Não pula etapas intermediárias se a anterior não estiver completamente preenchida e válida.
 */
export function determinarEtapaPorGates(estado: CalculatorState): number {
  // ---------------------------------------------------------------------------
  // GATE 1: DADOS DO EVENTO (Etapa 1)
  // Obrigatórios:
  // - data_evento: válida, real e não no passado
  // - horario_inicio_evento: formato HH:mm canônico real
  // - cidade: preenchida com mínimo de 2 caracteres
  // - qtd_adultos: inteiro estrito >= 1
  // - outras_bebidas_alcoolicas: 'SIM' | 'NAO'
  // - duração: OU evento_longo_ou_multiplos_dias === true OU duracao_horas válida (1..12 inteira)
  // ---------------------------------------------------------------------------
  const gate1Valido =
    Boolean(estado.data_evento && validarDataEvento(estado.data_evento)) &&
    Boolean(estado.horario_inicio_evento && validarHorarioInicio(estado.horario_inicio_evento)) &&
    Boolean(estado.cidade && estado.cidade.trim().length >= 2) &&
    validarQtdAdultos(estado.qtd_adultos) &&
    (estado.outras_bebidas_alcoolicas === 'SIM' || estado.outras_bebidas_alcoolicas === 'NAO') &&
    (estado.evento_longo_ou_multiplos_dias === true || validarDuracaoHoras(estado.duracao_horas));

  if (!gate1Valido) {
    return 1;
  }

  // ---------------------------------------------------------------------------
  // GATE 2: DIMENSIONAMENTO & CASOS ESPECIAIS (Etapa 2)
  // - Se for evento especial (>12h ou múltiplos dias), requer atendimento humano
  //   do Time Comercial Albanos; o fluxo NÃO avança automaticamente para o Mix.
  // - Se for evento normal, requer barris_total_escolhidos inteiro estrito >= 1.
  // ---------------------------------------------------------------------------
  if (estado.evento_longo_ou_multiplos_dias === true) {
    return 2;
  }

  if (!validarInteiroPositivoEstrito(estado.barris_total_escolhidos)) {
    return 2;
  }

  // ---------------------------------------------------------------------------
  // GATE 3: PORTFÓLIO & MIX DE ESTILOS (Etapa 3)
  // - Exige que a soma dos barris por estilo feche com exatidão matemática com
  //   o total de barris escolhidos (barris_total_escolhidos).
  // ---------------------------------------------------------------------------
  const totalBarris = estado.barris_total_escolhidos as number;
  if (!validarInvarianteMix(estado.mix, totalBarris).valido) {
    return 3;
  }

  // ---------------------------------------------------------------------------
  // GATE 4: EQUIPAMENTOS (Etapa 4)
  // - Exige resposta explícita e deliberada para chopeira e gás (ambos booleanos).
  // ---------------------------------------------------------------------------
  if (estado.precisa_chopeira === undefined || estado.precisa_gas === undefined) {
    return 4;
  }

  // ---------------------------------------------------------------------------
  // GATE 5: LOGÍSTICA & FRETE (Etapa 5)
  // - Exige modalidade definida (ENTREGA ou RETIRADA_FABRICA).
  // - Se ENTREGA: logradouro, número, bairro preenchidos + data_entrega e hora_entrega válidas.
  // - Se RETIRADA_FABRICA: data_retirada e hora_retirada válidas.
  // ---------------------------------------------------------------------------
  if (!estado.modalidade_logistica || estado.modalidade_logistica === 'A_DEFINIR') {
    return 5;
  }

  if (estado.modalidade_logistica === 'ENTREGA') {
    const end = estado.endereco;
    const enderecoValido = Boolean(
      end &&
      end.logradouro && end.logradouro.trim() &&
      end.numero && end.numero.trim() &&
      end.bairro && end.bairro.trim()
    );
    if (!enderecoValido) return 5;

    const dataEntregaValida =
      Boolean(estado.data_entrega && estado.data_entrega.trim()) &&
      validarDataLogistica(estado.data_entrega, estado.data_evento, undefined, 'entrega').valido;
    if (!dataEntregaValida) return 5;

    const horaEntregaValida =
      Boolean(estado.hora_entrega && estado.hora_entrega.trim()) &&
      validarHorarioLogistica(
        estado.hora_entrega,
        estado.data_entrega,
        estado.data_evento,
        estado.horario_inicio_evento,
        'entrega'
      ).valido;
    if (!horaEntregaValida) return 5;
  } else if (estado.modalidade_logistica === 'RETIRADA_FABRICA') {
    const dataRetiradaValida =
      Boolean(estado.data_retirada && estado.data_retirada.trim()) &&
      validarDataLogistica(estado.data_retirada, estado.data_evento, undefined, 'retirada').valido;
    if (!dataRetiradaValida) return 5;

    const horaRetiradaValida =
      Boolean(estado.hora_retirada && estado.hora_retirada.trim()) &&
      validarHorarioLogistica(
        estado.hora_retirada,
        estado.data_retirada,
        estado.data_evento,
        estado.horario_inicio_evento,
        'retirada'
      ).valido;
    if (!horaRetiradaValida) return 5;
  } else {
    return 5;
  }

  // ---------------------------------------------------------------------------
  // GATE 6: REVISÃO PRÉ-ORÇAMENTO (Etapa 6)
  // - A conferência pré-orçamento NÃO pode ser fabricada por URL nem herdada.
  // - Deve ser um ato explícito do usuário ao clicar em "Confirmar e Prosseguir".
  // ---------------------------------------------------------------------------
  if (!estado.revisao_pre_orcamento_confirmada) {
    return 6;
  }

  // ---------------------------------------------------------------------------
  // GATE 7: IDENTIFICAÇÃO DO LEAD (Etapa 7)
  // - Exige Nome completo (mínimo 3 caracteres) e Telefone com DDD (10 ou 11 dígitos).
  // ---------------------------------------------------------------------------
  if (!validarGateIdentificacao(estado.contato).valido) {
    return 7;
  }

  // ---------------------------------------------------------------------------
  // ETAPA 8: ORÇAMENTO & PAGAMENTO
  // - Todos os gates 1..7 cumpridos com integridade.
  // ---------------------------------------------------------------------------
  return 8;
}
