/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Motor Determinístico de Dimensionamento e Cenários V1.1
 */

import { CenarioQuantidade, OutrasBebidas } from '../types';
import {
  BARRIL_VOLUME_LITROS,
  TABELA_CONSUMO_INTEIRO,
  ZONA_JUSTA_LITROS,
} from './domainConfig';

export interface CenarioOpcao {
  cenario: CenarioQuantidade;
  barris: number;
  litrosComerciais: number;
  diferencaLitros: number; // positivo = sobra/acima, negativo = falta/abaixo
  recomendado: boolean;
  explicacao: string;
}

export interface DimensionamentoResultado {
  litrosEstimados: number;
  fatorConsumo: number;
  cenariosDisponiveis: CenarioOpcao[];
  cenarioJusto?: CenarioOpcao;
  cenarioEnxuto?: CenarioOpcao;
  cenarioAbundante?: CenarioOpcao;
}

/**
 * Calcula o fator de consumo (Litros/adulto) determinístico com base na duração e presença de outra bebida alcoólica.
 * Aceita estritamente números inteiros de 1 a 12 horas.
 */
export function calcularFatorConsumo(
  duracaoHoras: number,
  outrasBebidas: OutrasBebidas
): number {
  if (!Number.isInteger(duracaoHoras) || duracaoHoras < 1 || duracaoHoras > 12) {
    throw new Error('Duração inválida. A duração deve ser um número inteiro entre 1 e 12 horas.');
  }

  const comOutra = outrasBebidas === 'SIM';
  const entrada = TABELA_CONSUMO_INTEIRO[duracaoHoras];
  if (!entrada) {
    throw new Error(`Duração ${duracaoHoras}h não encontrada na tabela canônica.`);
  }

  return comOutra ? entrada.comOutraAlcoolica : entrada.somenteChope;
}

/**
 * Motor determinístico de dimensionamento.
 * FÓRMULA ÚNICA: litros_estimados = qtd_adultos * consumo_por_adulto_da_faixa
 * É estritamente proibido multiplicar novamente pela duração.
 */
export function calcularDimensionamento(
  qtdAdultos: number,
  duracaoHoras: number,
  outrasBebidas: OutrasBebidas
): DimensionamentoResultado {
  if (!qtdAdultos || qtdAdultos <= 0) {
    throw new Error('Quantidade de adultos deve ser maior que zero.');
  }
  if (!duracaoHoras || !Number.isInteger(duracaoHoras) || duracaoHoras < 1 || duracaoHoras > 12) {
    throw new Error('Duração deve ser um número inteiro de 1 a 12 horas.');
  }
  if (outrasBebidas !== 'SIM' && outrasBebidas !== 'NAO') {
    throw new Error('Presença de outras bebidas alcoólicas deve ser informada (SIM ou NAO).');
  }

  const fator = calcularFatorConsumo(duracaoHoras, outrasBebidas);
  // Arredondamento para 1 casa decimal na referência matemática (ou 2 se necessário)
  const litrosEstimados = Number((qtdAdultos * fator).toFixed(2));

  // Cálculo dos múltiplos de 50L
  const multiploInferior = Math.floor(litrosEstimados / BARRIL_VOLUME_LITROS) * BARRIL_VOLUME_LITROS;
  const multiploSuperior = Math.ceil(litrosEstimados / BARRIL_VOLUME_LITROS) * BARRIL_VOLUME_LITROS;

  const cenarios: CenarioOpcao[] = [];
  let cenarioJusto: CenarioOpcao | undefined;
  let cenarioEnxuto: CenarioOpcao | undefined;
  let cenarioAbundante: CenarioOpcao | undefined;

  // Verifica Zona Justa (diferença absoluta <= 10L)
  const diffSup = Number((multiploSuperior - litrosEstimados).toFixed(2));
  const diffInf = Number((multiploInferior - litrosEstimados).toFixed(2));

  // Caso especial de exato múltiplo
  if (diffSup === 0) {
    const barris = multiploSuperior / BARRIL_VOLUME_LITROS;
    cenarioJusto = {
      cenario: 'JUSTO',
      barris,
      litrosComerciais: multiploSuperior,
      diferencaLitros: 0,
      recomendado: true,
      explicacao: `${barris} barris (${multiploSuperior} L) atende exatamente a referência matemática calculada.`,
    };
    cenarios.push(cenarioJusto);
  } else if (diffSup <= ZONA_JUSTA_LITROS) {
    // Múltiplo superior dentro da zona justa (<= 10L)
    const barris = multiploSuperior / BARRIL_VOLUME_LITROS;
    cenarioJusto = {
      cenario: 'JUSTO',
      barris,
      litrosComerciais: multiploSuperior,
      diferencaLitros: diffSup,
      recomendado: true,
      explicacao: `${barris} barris (${multiploSuperior} L) com margem segura de +${diffSup} L da referência (${litrosEstimados} L).`,
    };
    cenarios.push(cenarioJusto);
  } else if (multiploInferior > 0 && Math.abs(diffInf) <= ZONA_JUSTA_LITROS) {
    // Múltiplo inferior dentro da zona justa
    const barris = multiploInferior / BARRIL_VOLUME_LITROS;
    cenarioJusto = {
      cenario: 'JUSTO',
      barris,
      litrosComerciais: multiploInferior,
      diferencaLitros: diffInf,
      recomendado: true,
      explicacao: `${barris} barris (${multiploInferior} L) dentro da zona justa (${Math.abs(diffInf)} L da referência).`,
    };
    cenarios.push(cenarioJusto);
  } else {
    // Nenhum múltiplo na zona justa: apresentar ENXUTO e ABUNDANTE sem decidir pelo usuário
    const barrisEnxuto = Math.max(1, multiploInferior / BARRIL_VOLUME_LITROS);
    const litrosEnxuto = barrisEnxuto * BARRIL_VOLUME_LITROS;
    const diffEnxuto = Number((litrosEnxuto - litrosEstimados).toFixed(2));

    cenarioEnxuto = {
      cenario: 'ENXUTO',
      barris: barrisEnxuto,
      litrosComerciais: litrosEnxuto,
      diferencaLitros: diffEnxuto,
      recomendado: false,
      explicacao: `${barrisEnxuto} barris (${litrosEnxuto} L) — econômico (${Math.abs(diffEnxuto)} L abaixo da referência).`,
    };

    const barrisAbundante = multiploSuperior / BARRIL_VOLUME_LITROS;
    cenarioAbundante = {
      cenario: 'ABUNDANTE',
      barris: barrisAbundante,
      litrosComerciais: multiploSuperior,
      diferencaLitros: diffSup,
      recomendado: false,
      explicacao: `${barrisAbundante} barris (${multiploSuperior} L) — com folga confortável (+${diffSup} L acima da referência).`,
    };

    cenarios.push(cenarioEnxuto, cenarioAbundante);
  }

  return {
    litrosEstimados,
    fatorConsumo: fator,
    cenariosDisponiveis: cenarios,
    cenarioJusto,
    cenarioEnxuto,
    cenarioAbundante,
  };
}

/**
 * Converte qualquer quantidade de barris escolhida para seu respectivo cenário relativo
 * aos litros matemáticos estimados atuais.
 */
export function classificarCenarioBarris(
  barrisEscolhidos: number,
  litrosEstimados: number
): { cenario: CenarioQuantidade; diferencaLitros: number; litrosComerciais: number } {
  const litrosComerciais = barrisEscolhidos * BARRIL_VOLUME_LITROS;
  const diferencaLitros = Number((litrosComerciais - litrosEstimados).toFixed(2));

  if (Math.abs(diferencaLitros) <= ZONA_JUSTA_LITROS) {
    return { cenario: 'JUSTO', diferencaLitros, litrosComerciais };
  }
  if (diferencaLitros < 0) {
    return { cenario: 'ENXUTO', diferencaLitros, litrosComerciais };
  }
  return { cenario: 'ABUNDANTE', diferencaLitros, litrosComerciais };
}
