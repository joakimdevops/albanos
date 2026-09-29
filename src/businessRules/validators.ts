/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Validadores Canônicos Puros V1.2
 *
 * Módulo central de validação pura compartilhado entre UI, URL Adapter e Gates.
 * Nenhuma coerção silenciosa (floor/trunc/parseInt permissivo) é tolerada.
 */

import { obterDataHojeIso } from './logisticsEngine';

/**
 * Valida se a string/valor representa um número inteiro estrito (sem partes decimais, sem NaN, sem caracteres extras)
 */
export function validarInteiroEstrito(valor: any): boolean {
  if (typeof valor === 'number') {
    return Number.isInteger(valor);
  }
  if (typeof valor === 'string') {
    const limpo = valor.trim();
    if (!/^-?\d+$/.test(limpo)) return false;
    const n = Number(limpo);
    return Number.isInteger(n) && !Number.isNaN(n);
  }
  return false;
}

/**
 * Faz o parse estrito de um número inteiro.
 * Rejeita explicitamente decimais (ex: 4.5, 4.9), arredondamentos silenciosos ou caracteres não-dígito.
 */
export function parsearInteiroEstrito(valor: any): number | null {
  if (typeof valor === 'number') {
    return Number.isInteger(valor) ? valor : null;
  }
  if (typeof valor === 'string') {
    const limpo = valor.trim();
    if (!/^-?\d+$/.test(limpo)) return null;
    const n = Number(limpo);
    return Number.isInteger(n) && !Number.isNaN(n) ? n : null;
  }
  return null;
}

/**
 * Valida se um número é inteiro estrito estritamente positivo (>= 1)
 */
export function validarInteiroPositivoEstrito(valor: any): boolean {
  const n = parsearInteiroEstrito(valor);
  return n !== null && n >= 1;
}

/**
 * Valida se um número é inteiro estrito não-negativo (>= 0)
 */
export function validarInteiroNaoNegativoEstrito(valor: any): boolean {
  const n = parsearInteiroEstrito(valor);
  return n !== null && n >= 0;
}

/**
 * Valida se o nome do lead é obrigatório e possui no mínimo 3 caracteres válidos (espaços vazios não contam)
 */
export function validarNomeLead(nome?: string | null): boolean {
  if (!nome || typeof nome !== 'string') return false;
  const limpo = nome.trim();
  return limpo.length >= 3;
}

/**
 * Valida se o telefone sanitizado possui exatamente 10 ou 11 dígitos com DDD
 */
export function validarTelefoneLead(telefone?: string | null): boolean {
  if (!telefone || typeof telefone !== 'string') return false;
  const digitos = telefone.replace(/\D/g, '');
  return digitos.length === 10 || digitos.length === 11;
}

/**
 * Valida se o e-mail (opcional) é válido quando informado
 */
export function validarEmailLead(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return true; // opcional
  const limpo = email.trim();
  if (limpo.length === 0) return true; // opcional se vazio
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo);
}

/**
 * Valida o gate completo de identificação do lead (Etapa 7)
 */
export function validarGateIdentificacao(contato?: {
  nome_completo?: string | null;
  telefone_responsavel?: string | null;
  email?: string | null;
} | null): { valido: boolean; erro?: string } {
  if (!contato) {
    return { valido: false, erro: 'Identificação obrigatória' };
  }
  const nomeTrim = contato.nome_completo?.trim();
  if (!nomeTrim || nomeTrim.length < 3) {
    return { valido: false, erro: 'Nome completo obrigatório' };
  }
  const telDigitos = (contato.telefone_responsavel || '').replace(/\D/g, '');
  if (telDigitos.length < 10 || telDigitos.length > 11) {
    return { valido: false, erro: 'Telefone com DDD obrigatório' };
  }
  const emailTrim = contato.email?.trim();
  if (emailTrim && emailTrim.length > 0) {
    if (!validarEmailLead(emailTrim)) {
      return { valido: false, erro: 'E-mail inválido' };
    }
  }
  return { valido: true };
}

/**
 * Valida duração normal em horas: inteiro estrito de 1 a 12 (rejeita 4.5, 4.9, 0, >12, etc.)
 */
export function validarDuracaoHoras(duracao: any): boolean {
  const n = parsearInteiroEstrito(duracao);
  if (n === null) return false;
  return n >= 1 && n <= 12;
}

/**
 * Valida se um horário é canônico e real no formato HH:mm (00:00 a 23:59)
 * Rejeita formatos impossíveis como 25:00, 12:78, 99:99
 */
export function validarHorarioValido(horario?: string | null): boolean {
  if (!horario || typeof horario !== 'string') return false;
  const limpo = horario.trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(limpo);
  return Boolean(match);
}

/**
 * Alias retrocompatível para validação de horário
 */
export const validarHorarioInicio = validarHorarioValido;

/**
 * Valida data no formato YYYY-MM-DD verificando existência real no calendário (ex: rejeita 2026-02-30)
 */
export function validarDataIsoValida(dataIso?: string | null): boolean {
  if (!dataIso || typeof dataIso !== 'string') return false;
  const limpo = dataIso.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpo);
  if (!match) return false;
  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  if (ano < 2000 || ano > 2100) return false;
  if (mes < 1 || mes > 12) return false;
  const d = new Date(ano, mes - 1, dia);
  return (
    d.getFullYear() === ano &&
    d.getMonth() === mes - 1 &&
    d.getDate() === dia
  );
}

/**
 * Valida data do evento: deve ser data real e não pode estar no passado
 */
export function validarDataEvento(dataEvento?: string | null, hojeIso?: string): boolean {
  if (!validarDataIsoValida(dataEvento)) return false;
  const hoje = hojeIso || obterDataHojeIso();
  return (dataEvento as string) >= hoje;
}

/**
 * Valida quantidade de adultos consumidores: inteiro estrito >= 1
 */
export function validarQtdAdultos(qtdAdultos: any): boolean {
  const n = parsearInteiroEstrito(qtdAdultos);
  return n !== null && n >= 1;
}

/**
 * Valida total de pessoas: se informado, deve ser inteiro estrito >= 1 e >= adultos
 */
export function validarQtdPessoas(qtdPessoas: any, qtdAdultos?: any): boolean {
  if (qtdPessoas === undefined || qtdPessoas === null || qtdPessoas === '') return true;
  const n = parsearInteiroEstrito(qtdPessoas);
  if (n === null || n < 1) return false;
  if (qtdAdultos !== undefined && qtdAdultos !== null && qtdAdultos !== '') {
    const adultos = parsearInteiroEstrito(qtdAdultos);
    if (adultos !== null && n < adultos) return false;
  }
  return true;
}

/**
 * Valida parcelas de cartão: inteiro estrito de 1 a 12 (sem coerções de ponto flutuante)
 */
export function validarParcelasCartao(parcelas: any): boolean {
  const n = parsearInteiroEstrito(parcelas);
  return n !== null && n >= 1 && n <= 12;
}

/**
 * Valida quantidade total de barris: inteiro estrito >= 1
 */
export function validarBarrisTotal(barris: any): boolean {
  const n = parsearInteiroEstrito(barris);
  return n !== null && n >= 1;
}
