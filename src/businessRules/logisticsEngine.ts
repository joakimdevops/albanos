/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Motor de Regras de Logística e Retirada na Fábrica
 */

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
 * Define o horário padrão de retirada com base no horário do evento (ou 10:00 como fallback)
 */
export function obterHorarioPadraoRetirada(horarioInicioEvento?: string): string {
  if (horarioInicioEvento && horarioInicioEvento.trim()) {
    return horarioInicioEvento.trim();
  }
  return '10:00';
}

/**
 * Valida se a data de retirada na fábrica atende as regras de negócio:
 * 1. Precisa ser informada
 * 2. Precisa ser maior ou igual a hoje (não pode estar no passado)
 * 3. Precisa ser menor que a data do evento
 */
export function validarDataRetiradaFabrica(
  dataRetirada?: string,
  dataEvento?: string,
  hojeIso?: string
): { valido: boolean; motivo?: string } {
  if (!dataRetirada || !dataRetirada.trim()) {
    return {
      valido: false,
      motivo: 'Por favor, selecione a data pretendida para retirada na fábrica.',
    };
  }

  const hoje = hojeIso || obterDataHojeIso();

  // A data da retirada precisa ser maior ou igual a hoje
  if (dataRetirada < hoje) {
    return {
      valido: false,
      motivo: 'A data da retirada não pode estar no passado.',
    };
  }

  // A data da retirada precisa ser menor que a data do evento
  if (dataEvento && dataEvento.trim() && dataRetirada >= dataEvento) {
    return {
      valido: false,
      motivo: 'A data da retirada precisa ser menor que a data do evento.',
    };
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
