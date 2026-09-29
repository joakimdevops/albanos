/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Motor de Frete e Logística V1.1
 */

import { FreteResultado, ModalidadeLogistica } from '../types';
import {
  FRETE_BELO_HORIZONTE_VALOR,
  FRETE_COLAR_VALOR,
  FRETE_RMBH_VALOR,
  MUNICIPIOS_COLAR_METROPOLITANO,
  MUNICIPIOS_RMBH,
} from './domainConfig';

/**
 * Normaliza strings para comparação robusta de municípios (remove acentos, pontuação, trim e minúsculas).
 */
export function normalizarNomeCidade(cidade: string): string {
  return (cidade || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Motor determinístico de cálculo de frete baseado na tabela autorizada Albanos.
 */
export function calcularFrete(
  modalidade: ModalidadeLogistica,
  cidade?: string
): FreteResultado {
  if (modalidade === 'RETIRADA_FABRICA') {
    return {
      valor: 0.0,
      status: 'GRATIS',
      faixaNome: 'Retirada na Fábrica',
      detalhe: 'Sem custo de frete (retirada direta pelo cliente na cervejaria).',
    };
  }

  if (modalidade === 'A_DEFINIR' || !cidade || !cidade.trim()) {
    return {
      valor: null,
      status: 'A_CONFIRMAR',
      faixaNome: 'A definir',
      detalhe:
        modalidade === 'A_DEFINIR'
          ? 'Escolha entre entrega ou retirada na fábrica para definir o frete.'
          : 'Informe a cidade para identificar o valor do frete.',
    };
  }

  const cidadeNormalizada = normalizarNomeCidade(cidade);

  // 1. Belo Horizonte
  if (cidadeNormalizada === 'belo horizonte' || cidadeNormalizada === 'bh') {
    return {
      valor: FRETE_BELO_HORIZONTE_VALOR,
      status: 'FIXADO',
      faixaNome: 'Belo Horizonte',
      detalhe: 'Taxa padrão de entrega para Belo Horizonte.',
    };
  }

  // 2. Demais municípios da RMBH (R$ 75,00)
  const ehRMBH = MUNICIPIOS_RMBH.some(
    (m) => normalizarNomeCidade(m) === cidadeNormalizada
  );
  if (ehRMBH) {
    return {
      valor: FRETE_RMBH_VALOR,
      status: 'FIXADO',
      faixaNome: 'RMBH — Demais municípios',
      detalhe: 'Entrega na Região Metropolitana de BH.',
    };
  }

  // 3. Colar Metropolitano (R$ 100,00)
  const ehColar = MUNICIPIOS_COLAR_METROPOLITANO.some(
    (m) => normalizarNomeCidade(m) === cidadeNormalizada
  );
  if (ehColar) {
    return {
      valor: FRETE_COLAR_VALOR,
      status: 'FIXADO',
      faixaNome: 'Colar Metropolitano',
      detalhe: 'Entrega no Colar Metropolitano de BH.',
    };
  }

  // 4. Fora da tabela autorizada -> A_CONFIRMAR
  return {
    valor: null,
    status: 'A_CONFIRMAR',
    faixaNome: 'Fora da tabela autorizada',
    detalhe: 'Cidade fora da tabela padrão autorizada. O frete e a rota serão confirmados pelo Time Comercial Albanos.',
  };
}
