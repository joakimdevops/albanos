/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Motor de Regras de Logística e Retirada na Fábrica
 */

import { validarDataIsoValida, validarHorarioValido } from './validators';

/**
 * Retorna a data atual local no formato YYYY-MM-DD
 */
export function obterDataHojeIso(): string {
  const agora = new Date();
  const yyyy = agora.getFullYear();
  const mm = String(agora.getMonth() + 1).padStart(2, '0');
  const dd = String(agora.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calcula a data D - 1 (1 dia anterior) a partir de uma data no formato YYYY-MM-DD
 */
export function calcularDataDMenos1(dataIso: string): string {
  if (!dataIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return '';
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() - 1);
  const yyyy = data.getFullYear();
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const dd = String(data.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Adiciona uma quantidade de dias a uma data YYYY-MM-DD
 */
export function calcularDataMaisDias(dataIso: string, dias: number): string {
  if (!dataIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return '';
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + dias);
  const yyyy = data.getFullYear();
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const dd = String(data.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Define o horário padrão de retirada com base no horário do evento (ou 10:00 como fallback retrocompatível)
 */
export function obterHorarioPadraoRetirada(horarioInicioEvento?: string): string {
  if (horarioInicioEvento && horarioInicioEvento.trim()) {
    const sug = obterHorarioSugeridoLogistica(horarioInicioEvento);
    if (sug) return sug;
  }
  return '10:00';
}

/**
 * Calcula a data sugerida para logística (D - 1 ou hoje, se D-1 já estiver no passado)
 * D-1 é apenas sugestão de conveniência, nunca imposição restritiva.
 */
export function calcularSugestaoDataLogistica(dataEvento?: string, hojeIso?: string): string {
  if (!dataEvento || !/^\d{4}-\d{2}-\d{2}$/.test(dataEvento)) return '';
  const hoje = hojeIso || obterDataHojeIso();
  const dMenos1 = calcularDataDMenos1(dataEvento);
  if (dMenos1 && dMenos1 >= hoje) {
    return dMenos1;
  }
  if (hoje <= dataEvento) {
    return hoje;
  }
  return dataEvento;
}

/**
 * Obtém o horário sugerido para logística (entrega ou retirada) baseado no início do evento:
 * - Evento começa antes de 10h -> sugerir 10:00
 * - Evento começa entre 10h e 17h -> sugerir o mesmo horário
 * - Evento começa depois de 17h -> sugerir 17:00
 * - Se o horário do evento não existir: retorna undefined (não inventa horário comercial arbitrário)
 */
export function obterHorarioSugeridoLogistica(horarioInicioEvento?: string): string | undefined {
  if (!horarioInicioEvento || !horarioInicioEvento.trim()) {
    return undefined;
  }
  const h = horarioInicioEvento.trim();
  if (h < '10:00') {
    return '10:00';
  }
  if (h > '17:00') {
    return '17:00';
  }
  return h;
}

/**
 * Valida a data de logística (entrega ou retirada na fábrica):
 * Regra: data atual <= data escolhida <= data do evento
 * - hoje é válido
 * - o próprio dia do evento é válido
 * - qualquer data intermediária é válida
 * - data anterior a hoje é inválida
 * - data posterior ao evento é inválida
 */
export function validarDataLogistica(
  dataEscolhida?: string,
  dataEvento?: string,
  hojeIso?: string,
  tipo: 'entrega' | 'retirada' = 'retirada'
): { valido: boolean; motivo?: string } {
  const termo = tipo === 'entrega' ? 'entrega' : 'retirada na fábrica';

  if (!dataEscolhida || !dataEscolhida.trim()) {
    return {
      valido: false,
      motivo: `Por favor, selecione a data pretendida para ${termo}.`,
    };
  }

  // Verifica se é uma data real existente no calendário (formato YYYY-MM-DD válido)
  if (!validarDataIsoValida(dataEscolhida)) {
    return {
      valido: false,
      motivo: `A data informada para ${termo} é inválida ou não existe no calendário.`,
    };
  }

  const hoje = hojeIso || obterDataHojeIso();

  // A data precisa ser maior ou igual a hoje
  if (dataEscolhida < hoje) {
    return {
      valido: false,
      motivo: `A data da ${tipo === 'entrega' ? 'entrega' : 'retirada'} não pode estar no passado.`,
    };
  }

  // A data não pode ser posterior ao evento (o próprio dia do evento é permitido)
  if (dataEvento && dataEvento.trim() && dataEscolhida > dataEvento) {
    return {
      valido: false,
      motivo: `A data da ${tipo === 'entrega' ? 'entrega' : 'retirada'} não pode ser posterior à data do evento (${formatarDataBrasileira(dataEvento)}).`,
    };
  }

  return { valido: true };
}

/**
 * Valida se a data de retirada na fábrica atende as regras de negócio
 * Retrocompatibilidade com chamadas existentes
 */
export function validarDataRetiradaFabrica(
  dataRetirada?: string,
  dataEvento?: string,
  hojeIso?: string
): { valido: boolean; motivo?: string } {
  return validarDataLogistica(dataRetirada, dataEvento, hojeIso, 'retirada');
}

/**
 * Valida se a data de entrega no local atende as regras de negócio
 */
export function validarDataEntrega(
  dataEntrega?: string,
  dataEvento?: string,
  hojeIso?: string
): { valido: boolean; motivo?: string } {
  return validarDataLogistica(dataEntrega, dataEvento, hojeIso, 'entrega');
}

/**
 * Obtém os limites válidos de horário para a data selecionada:
 * - Janela comercial fixa: 10:00 até 17:00
 * - Se for no próprio dia do evento e houver horário de início do evento:
 *   não pode ser posterior ao início do evento.
 */
export function obterLimitesHorarioLogistica(
  dataEscolhida?: string,
  dataEvento?: string,
  horarioInicioEvento?: string
): {
  min: string;
  max: string;
  indisponivelMesmoDia: boolean;
  motivoIndisponivel?: string;
} {
  const minPadrao = '10:00';
  const maxPadrao = '17:00';

  if (
    dataEscolhida &&
    dataEvento &&
    dataEscolhida === dataEvento &&
    horarioInicioEvento &&
    horarioInicioEvento.trim()
  ) {
    const hEvento = horarioInicioEvento.trim();
    if (hEvento < minPadrao) {
      return {
        min: minPadrao,
        max: maxPadrao,
        indisponivelMesmoDia: true,
        motivoIndisponivel: `Como o evento inicia às ${hEvento} (antes das 10:00), não há horários disponíveis para atendimento no mesmo dia dentro da janela comercial (10h às 17h). Por favor, selecione uma data anterior.`,
      };
    }
    const maxValido = hEvento < maxPadrao ? hEvento : maxPadrao;
    return {
      min: minPadrao,
      max: maxValido,
      indisponivelMesmoDia: false,
    };
  }

  return {
    min: minPadrao,
    max: maxPadrao,
    indisponivelMesmoDia: false,
  };
}

/**
 * Valida o horário de logística (entrega ou retirada):
 * 1. Precisa ser preenchido
 * 2. Janela comercial: 10:00 às 17:00, inclusive
 * 3. Se for no próprio dia do evento e houver horário de início: horário logístico <= horário de início
 */
export function validarHorarioLogistica(
  horarioEscolhido?: string,
  dataEscolhida?: string,
  dataEvento?: string,
  horarioInicioEvento?: string,
  tipo: 'entrega' | 'retirada' = 'retirada'
): { valido: boolean; motivo?: string } {
  const termo = tipo === 'entrega' ? 'entrega' : 'retirada na fábrica';

  if (!horarioEscolhido || !horarioEscolhido.trim()) {
    return {
      valido: false,
      motivo: `Por favor, informe o horário pretendido de ${termo}.`,
    };
  }

  const h = horarioEscolhido.trim();

  // Validação de horário canônico real HH:mm (00..23 : 00..59)
  if (!validarHorarioValido(h)) {
    return {
      valido: false,
      motivo: `O horário de ${termo} deve representar uma hora real no formato HH:mm.`,
    };
  }

  // Validação da janela comercial (10:00 às 17:00)
  if (h < '10:00' || h > '17:00') {
    return {
      valido: false,
      motivo: `O horário de ${tipo === 'entrega' ? 'entrega' : 'retirada'} deve ser dentro da janela comercial das 10:00 às 17:00.`,
    };
  }

  // Se for no dia do evento, valida interseção com horário de início do evento
  if (
    dataEscolhida &&
    dataEvento &&
    dataEscolhida === dataEvento &&
    horarioInicioEvento &&
    horarioInicioEvento.trim()
  ) {
    const hEvento = horarioInicioEvento.trim();
    if (hEvento < '10:00') {
      return {
        valido: false,
        motivo: `Como o evento inicia às ${hEvento}, não é possível agendar ${tipo === 'entrega' ? 'entrega' : 'retirada'} no mesmo dia dentro do horário comercial (10h às 17h). Por favor, escolha uma data anterior.`,
      };
    }
    if (h > hEvento) {
      return {
        valido: false,
        motivo: `No dia do evento, o horário de ${tipo === 'entrega' ? 'entrega' : 'retirada'} não pode ser posterior ao início do evento (${hEvento}).`,
      };
    }
  }

  return { valido: true };
}

/**
 * Converte data ISO YYYY-MM-DD para formato brasileiro DD/MM/YYYY
 */
export function formatarDataBrasileira(dataIso?: string): string {
  if (!dataIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return dataIso || '';
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}
