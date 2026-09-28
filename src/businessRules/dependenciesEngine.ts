/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Matriz de Dependências e Invalidação Seletiva V1.1
 */

import { CalculatorState } from '../types';
import { calcularOrcamento } from './budgetEngine';
import { calcularDimensionamento, classificarCenarioBarris } from './dimensioningEngine';
import { calcularFrete } from './freightEngine';
import { sugerirMix, validarInvarianteMix } from './mixEngine';
import {
  calcularSugestaoDataLogistica,
  obterHorarioSugeridoLogistica,
} from './logisticsEngine';

/**
 * Calcula a prioridade de atendimento com base na data do evento e na data atual do sistema.
 */
export function calcularPrioridade(
  dataEvento?: string,
  urgenciaExplicita?: boolean
): { prioridade: CalculatorState['prioridade_atendimento']; diasAteEvento?: number } {
  if (urgenciaExplicita) {
    return { prioridade: 'IMEDIATA' };
  }

  if (!dataEvento) {
    return { prioridade: 'NORMAL' };
  }

  const [ano, mes, dia] = dataEvento.split('-').map(Number);
  const dataEv = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diffMs = dataEv.getTime() - hoje.getTime();
  const diasAteEvento = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diasAteEvento < 0) {
    return { prioridade: 'NORMAL', diasAteEvento }; // Inconsistência de data passada tratada na validação
  }

  if (diasAteEvento <= 3) {
    return { prioridade: 'URGENTE_DATA', diasAteEvento };
  }

  return { prioridade: 'NORMAL', diasAteEvento };
}

/**
 * Recalcula apenas os descendentes estritamente necessários após uma alteração no estado.
 * Princípio da Especificação Técnica:
 * MUDOU INPUT -> IDENTIFICAR SOMENTE OS DESCENDENTES REAIS -> RECALCULAR/INVALIDAR SOMENTE ELES -> PRESERVAR TUDO QUE CONTINUA VÁLIDO.
 */
export function aplicarMudancaEstado(
  estadoAtual: CalculatorState,
  campo: keyof CalculatorState | string,
  novoValor: any
): CalculatorState {
  const novoEstado: CalculatorState = { ...estadoAtual, [campo]: novoValor };

  switch (campo) {
    case 'data_evento': {
      const { prioridade, diasAteEvento } = calcularPrioridade(
        novoEstado.data_evento,
        novoEstado.urgencia_explicita
      );
      novoEstado.prioridade_atendimento = prioridade;
      novoEstado.dias_ate_evento = diasAteEvento;
      // Não altera orçamento, quantidade, mix ou aceite!
      break;
    }

    case 'qtd_adultos':
    case 'duracao_horas':
    case 'outras_bebidas_alcoolicas': {
      if (
        novoEstado.qtd_adultos &&
        novoEstado.qtd_adultos > 0 &&
        novoEstado.duracao_horas &&
        novoEstado.duracao_horas > 0 &&
        novoEstado.outras_bebidas_alcoolicas
      ) {
        const dim = calcularDimensionamento(
          novoEstado.qtd_adultos,
          novoEstado.duracao_horas,
          novoEstado.outras_bebidas_alcoolicas
        );
        novoEstado.litros_estimados = dim.litrosEstimados;
        novoEstado.fator_consumo_usado = dim.fatorConsumo;

        // Se já houver barris escolhidos, reclassifica o cenário com relação aos novos litros
        if (novoEstado.barris_total_escolhidos) {
          const classificacao = classificarCenarioBarris(
            novoEstado.barris_total_escolhidos,
            dim.litrosEstimados
          );
          novoEstado.cenario_quantidade = classificacao.cenario;
        } else {
          // Caso A: Existe cenário JUSTO -> pode ser pré-selecionado como recomendação comercial principal
          if (dim.cenarioJusto) {
            novoEstado.barris_total_escolhidos = dim.cenarioJusto.barris;
            novoEstado.cenario_quantidade = 'JUSTO';
          } else {
            // Caso B: Não existe JUSTO (apenas ENXUTO e ABUNDANTE) -> Nenhuma decisão automática; usuário deve escolher
            novoEstado.barris_total_escolhidos = undefined;
            novoEstado.cenario_quantidade = undefined;
          }
        }
      }
      break;
    }

    case 'barris_total_escolhidos': {
      const barris = Number(novoValor);
      novoEstado.barris_total_escolhidos = barris;

      if (novoEstado.litros_estimados) {
        const classificacao = classificarCenarioBarris(barris, novoEstado.litros_estimados);
        novoEstado.cenario_quantidade = classificacao.cenario;
      }

      // Se não tiver mix, garante objeto zerado
      if (!novoEstado.mix) {
        novoEstado.mix = {
          pilsen: 0,
          life_lager: 0,
          session_ipa: 0,
          amber: 0,
          american_ipa: 0,
          pale_ale: 0,
        };
      }

      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'mix': {
      // Quando o mix muda, recalcula produtos e orçamento determinístico
      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'evento_longo_ou_multiplos_dias': {
      novoEstado.evento_longo_ou_multiplos_dias = Boolean(novoValor);
      // Preserva dados preenchidos e não extrapola dimensionamento além de 12h
      break;
    }

    case 'cidade':
    case 'modalidade_logistica': {
      if (novoEstado.modalidade_logistica === 'RETIRADA_FABRICA') {
        if (!novoEstado.data_retirada && novoEstado.data_evento) {
          novoEstado.data_retirada = calcularSugestaoDataLogistica(novoEstado.data_evento);
        }
        if (!novoEstado.hora_retirada && novoEstado.horario_inicio_evento) {
          const sugHora = obterHorarioSugeridoLogistica(novoEstado.horario_inicio_evento);
          if (sugHora) novoEstado.hora_retirada = sugHora;
        }
      } else if (novoEstado.modalidade_logistica === 'ENTREGA') {
        if (!novoEstado.data_entrega && novoEstado.data_evento) {
          novoEstado.data_entrega = calcularSugestaoDataLogistica(novoEstado.data_evento);
        }
        if (!novoEstado.hora_entrega && novoEstado.horario_inicio_evento) {
          const sugHora = obterHorarioSugeridoLogistica(novoEstado.horario_inicio_evento);
          if (sugHora) novoEstado.hora_entrega = sugHora;
        }
      }

      novoEstado.frete = calcularFrete(
        novoEstado.modalidade_logistica,
        novoEstado.cidade
      );

      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'precisa_chopeira':
    case 'precisa_gas': {
      // Solicitação registrada; quantidade e disponibilidade confirmadas pelo time humano
      break;
    }

    case 'forma_pagamento':
    case 'parcelas_cartao':
    case 'houve_barganha':
    case 'cupom_desconto':
    case 'frete': {
      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'revisao_pre_orcamento_confirmada': {
      novoEstado.revisao_pre_orcamento_confirmada = Boolean(novoValor);
      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'orcamento': {
      novoEstado.orcamento = novoValor;
      break;
    }
  }

  return novoEstado;
}

/**
 * Função utilitária para garantir que o orçamento reflita deterministamente o estado atual.
 */
function sincronizarOrcamento(estado: CalculatorState): void {
  const barris = estado.barris_total_escolhidos;
  if (!barris || barris <= 0) {
    return;
  }

  // Se o estado não possuir mix inicial definido, inicializa zerado
  if (!estado.mix) {
    estado.mix = {
      pilsen: 0,
      life_lager: 0,
      session_ipa: 0,
      amber: 0,
      american_ipa: 0,
      pale_ale: 0,
    };
  }

  const orcamentoAntigoTotal = estado.orcamento?.totalGeral;

  // Garante cálculo determinístico do orçamento
  estado.orcamento = calcularOrcamento({
    barrisTotal: barris,
    mix: estado.mix,
    frete: estado.frete,
    formaPagamento: estado.forma_pagamento,
    parcelasCartao: estado.parcelas_cartao,
    houveBarganha: estado.houve_barganha,
  });

  // Se o total mudou e o orçamento já havia sido revisado pelo usuário, exige novo aceite
  if (
    estado.revisao_pre_orcamento_confirmada &&
    orcamentoAntigoTotal !== undefined &&
    estado.orcamento.totalGeral !== orcamentoAntigoTotal
  ) {
    estado.aceite_orcamento = 'PENDENTE';
  }
}
