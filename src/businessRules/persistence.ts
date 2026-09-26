/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Módulo de Persistência Local (LocalStorage) V1.1
 */

import { CalculatorState } from '../types';
import { ESTADO_INICIAL, CONTRACT_VERSION } from './domainConfig';

export const ALBANOS_STORAGE_KEY = 'albanos_chopp_calculator_session_v1';

export interface StoredSession {
  state: CalculatorState;
  etapaAtual: number;
  timestamp: number;
  versao: string;
}

/**
 * Salva o estado atual e a etapa no LocalStorage com tratamento resiliente de erros.
 */
export function salvarSessaoNoLocalStorage(
  state: CalculatorState,
  etapaAtual: number,
  storageOverride?: Storage
): boolean {
  const storage =
    storageOverride || (typeof window !== 'undefined' ? window.localStorage : undefined);

  if (!storage) {
    return false;
  }

  try {
    const payload: StoredSession = {
      state,
      etapaAtual,
      timestamp: Date.now(),
      versao: CONTRACT_VERSION,
    };
    storage.setItem(ALBANOS_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Erro ao salvar progresso no LocalStorage:', err);
    return false;
  }
}

/**
 * Carrega a sessão salva do LocalStorage, validando campos e mesclando com o estado padrão.
 */
export function carregarSessaoDoLocalStorage(
  storageOverride?: Storage
): StoredSession | null {
  const storage =
    storageOverride || (typeof window !== 'undefined' ? window.localStorage : undefined);

  if (!storage) {
    return null;
  }

  try {
    const item = storage.getItem(ALBANOS_STORAGE_KEY);
    if (!item) {
      return null;
    }

    const parsed = JSON.parse(item) as Partial<StoredSession>;
    if (!parsed || typeof parsed !== 'object' || !parsed.state) {
      return null;
    }

    // Mescla com estado inicial para garantir integridade caso propriedades novas existam
    const stateRestaurado: CalculatorState = {
      ...ESTADO_INICIAL,
      ...parsed.state,
      endereco: {
        ...ESTADO_INICIAL.endereco,
        ...(parsed.state.endereco || {}),
      },
      mix: {
        ...ESTADO_INICIAL.mix,
        ...(parsed.state.mix || {}),
      },
      frete: {
        ...ESTADO_INICIAL.frete,
        ...(parsed.state.frete || {}),
      },
      contato: {
        ...ESTADO_INICIAL.contato,
        ...(parsed.state.contato || {}),
      },
    };

    const etapaValida =
      typeof parsed.etapaAtual === 'number' && parsed.etapaAtual >= 0 && parsed.etapaAtual <= 9
        ? parsed.etapaAtual
        : 0;

    return {
      state: stateRestaurado,
      etapaAtual: etapaValida,
      timestamp: parsed.timestamp || Date.now(),
      versao: parsed.versao || CONTRACT_VERSION,
    };
  } catch (err) {
    console.warn('Erro ao restaurar sessão do LocalStorage:', err);
    return null;
  }
}

/**
 * Remove os dados salvos do LocalStorage (ao reiniciar ou limpar o formulário).
 */
export function limparSessaoDoLocalStorage(storageOverride?: Storage): void {
  const storage =
    storageOverride || (typeof window !== 'undefined' ? window.localStorage : undefined);

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(ALBANOS_STORAGE_KEY);
  } catch (err) {
    console.warn('Erro ao limpar LocalStorage:', err);
  }
}

/**
 * Verifica se a sessão contém dados preenchidos pelo usuário além do padrão.
 */
export function temDadosPreenchidos(session: StoredSession | null): boolean {
  if (!session) return false;
  const s = session.state;
  if (session.etapaAtual > 0) return true;
  if (s.qtd_adultos && s.qtd_adultos > 0) return true;
  if (s.data_evento && s.data_evento.trim() !== '') return true;
  if (s.barris_total_escolhidos && s.barris_total_escolhidos > 0) return true;
  return false;
}
