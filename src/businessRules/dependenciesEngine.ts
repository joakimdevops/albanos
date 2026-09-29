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
 * Compara se dois valores são semanticamente iguais
 */
function saoValoresIguais(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

const CAMPOS_REVISAO = [
  'data_evento',
  'horario_inicio_evento',
  'cidade',
  'qtd_pessoas',
  'qtd_adultos',
  'duracao_horas',
  'evento_longo_ou_multiplos_dias',
  'outras_bebidas_alcoolicas',
  'cenario_quantidade',
  'barris_total_escolhidos',
  'mix',
  'precisa_chopeira',
  'precisa_gas',
  'modalidade_logistica',
  'endereco',
  'data_entrega',
  'hora_entrega',
  'data_retirada',
  'hora_retirada',
  'frete',
];

const CAMPOS_CONDICAO_FINANCEIRA = [
  'forma_pagamento',
  'parcelas_cartao',
  'houve_barganha',
  'cupom_desconto',
];

/**
 * Recalcula dimensionamento se os inputs forem válidos e o evento não for especial (>12h).
 */
function recalcularDimensionamentoSeValido(estado: CalculatorState): void {
  // Se for evento especial (>12h ou múltiplos dias), NÃO calcula litros automaticamente!
  if (estado.evento_longo_ou_multiplos_dias) {
    estado.litros_estimados = undefined;
    estado.fator_consumo_usado = undefined;
    estado.cenario_quantidade = undefined;
    estado.barris_total_escolhidos = undefined;
    estado.orcamento = undefined;
    return;
  }

  if (
    estado.qtd_adultos &&
    estado.qtd_adultos > 0 &&
    estado.duracao_horas &&
    Number.isInteger(estado.duracao_horas) &&
    estado.duracao_horas >= 1 &&
    estado.duracao_horas <= 12 &&
    estado.outras_bebidas_alcoolicas
  ) {
    const dim = calcularDimensionamento(
      estado.qtd_adultos,
      estado.duracao_horas,
      estado.outras_bebidas_alcoolicas
    );
    estado.litros_estimados = dim.litrosEstimados;
    estado.fator_consumo_usado = dim.fatorConsumo;

    // Se já houver barris escolhidos, reclassifica o cenário com relação aos novos litros
    if (estado.barris_total_escolhidos) {
      const classificacao = classificarCenarioBarris(
        estado.barris_total_escolhidos,
        dim.litrosEstimados
      );
      estado.cenario_quantidade = classificacao.cenario;
    } else {
      // Caso A: Existe cenário JUSTO -> pode ser pré-selecionado como recomendação comercial principal
      if (dim.cenarioJusto) {
        estado.barris_total_escolhidos = dim.cenarioJusto.barris;
        estado.cenario_quantidade = 'JUSTO';
      } else {
        // Caso B: Não existe JUSTO (apenas ENXUTO e ABUNDANTE) -> Nenhuma decisão automática; usuário deve escolher
        estado.barris_total_escolhidos = undefined;
        estado.cenario_quantidade = undefined;
      }
    }
  } else {
    estado.litros_estimados = undefined;
    estado.fator_consumo_usado = undefined;
  }
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

  // Invalidação semântica: qualquer alteração material nos dados da revisão invalida revisao_pre_orcamento_confirmada
  if (
    CAMPOS_REVISAO.includes(campo) &&
    campo !== 'revisao_pre_orcamento_confirmada' &&
    !saoValoresIguais(estadoAtual[campo as keyof CalculatorState], novoValor)
  ) {
    novoEstado.revisao_pre_orcamento_confirmada = false;
    if (estadoAtual.aceite_orcamento === 'SIM') {
      novoEstado.aceite_orcamento = 'PENDENTE';
    }
  }

  // Invalidação semântica: qualquer alteração na condição financeira com aceite ativo invalida aceite_orcamento
  if (
    CAMPOS_CONDICAO_FINANCEIRA.includes(campo) &&
    campo !== 'aceite_orcamento' &&
    !saoValoresIguais(estadoAtual[campo as keyof CalculatorState], novoValor)
  ) {
    if (estadoAtual.aceite_orcamento === 'SIM') {
      novoEstado.aceite_orcamento = 'PENDENTE';
    }
  }

  switch (campo) {
    case 'data_evento': {
      const { prioridade, diasAteEvento } = calcularPrioridade(
        novoEstado.data_evento,
        novoEstado.urgencia_explicita
      );
      novoEstado.prioridade_atendimento = prioridade;
      novoEstado.dias_ate_evento = diasAteEvento;
      break;
    }

    case 'duracao_horas': {
      // Se duração válida for informada, ela desativa o evento especial (>12h) por exclusividade mútua
      if (
        novoValor !== undefined &&
        novoValor !== null &&
        typeof novoValor === 'number' &&
        Number.isInteger(novoValor) &&
        novoValor >= 1 &&
        novoValor <= 12
      ) {
        novoEstado.duracao_horas = novoValor;
        novoEstado.evento_longo_ou_multiplos_dias = false;
      } else {
        novoEstado.duracao_horas = undefined;
      }
      recalcularDimensionamentoSeValido(novoEstado);
      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'qtd_adultos':
    case 'outras_bebidas_alcoolicas': {
      recalcularDimensionamentoSeValido(novoEstado);
      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'barris_total_escolhidos': {
      if (novoEstado.evento_longo_ou_multiplos_dias) {
        novoEstado.barris_total_escolhidos = undefined;
        novoEstado.cenario_quantidade = undefined;
        novoEstado.orcamento = undefined;
        break;
      }

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
      if (novoEstado.evento_longo_ou_multiplos_dias) {
        novoEstado.orcamento = undefined;
        break;
      }
      // Quando o mix muda, recalcula produtos e orçamento determinístico
      sincronizarOrcamento(novoEstado);
      break;
    }

    case 'evento_longo_ou_multiplos_dias': {
      const ativou = Boolean(novoValor);
      novoEstado.evento_longo_ou_multiplos_dias = ativou;

      // Exclusividade mútua: tanto ao ativar quanto ao desmarcar, remove duração anterior e dados derivados
      novoEstado.duracao_horas = undefined;
      novoEstado.litros_estimados = undefined;
      novoEstado.fator_consumo_usado = undefined;
      novoEstado.cenario_quantidade = undefined;
      novoEstado.barris_total_escolhidos = undefined;
      novoEstado.mix = {
        pilsen: 0,
        life_lager: 0,
        session_ipa: 0,
        amber: 0,
        american_ipa: 0,
        pale_ale: 0,
      };
      novoEstado.orcamento = undefined;
      novoEstado.revisao_pre_orcamento_confirmada = false;
      if (novoEstado.aceite_orcamento === 'SIM') {
        novoEstado.aceite_orcamento = 'PENDENTE';
      }
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
      if (novoEstado.aceite_orcamento === 'SIM') {
        novoEstado.aceite_orcamento = 'PENDENTE';
      }
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
  // Evento especial >12h não gera orçamento automático
  if (estado.evento_longo_ou_multiplos_dias) {
    estado.orcamento = undefined;
    return;
  }

  const barris = estado.barris_total_escolhidos;
  if (!barris || barris <= 0) {
    estado.orcamento = undefined;
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

  // Se o total mudou e o orçamento já havia sido aceito pelo usuário, exige novo aceite
  if (
    orcamentoAntigoTotal !== undefined &&
    estado.orcamento.totalGeral !== orcamentoAntigoTotal &&
    estado.aceite_orcamento === 'SIM'
  ) {
    estado.aceite_orcamento = 'PENDENTE';
  }
}
