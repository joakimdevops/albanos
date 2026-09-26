/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Motor de Mix de Estilos e Invariantes V1.1
 */

import { EstiloChope, MixBarris } from '../types';

export const MIX_ZERADO: MixBarris = {
  pilsen: 0,
  life_lager: 0,
  session_ipa: 0,
  amber: 0,
  american_ipa: 0,
  pale_ale: 0,
};

/**
 * Calcula a soma total dos barris no mix atual.
 */
export function somarBarrisMix(mix: MixBarris): number {
  return (
    (mix.pilsen || 0) +
    (mix.life_lager || 0) +
    (mix.session_ipa || 0) +
    (mix.amber || 0) +
    (mix.american_ipa || 0) +
    (mix.pale_ale || 0)
  );
}

/**
 * Valida o invariante obrigatório do mix:
 * SOMA(barris por estilo) === barris_total_escolhidos
 * e nenhum estilo pode ter quantidade negativa.
 */
export function validarInvarianteMix(
  mix: MixBarris,
  barrisTotal: number
): { valido: boolean; somaAtual: number; diferenca: number; mensagem?: string } {
  // Checar valores negativos
  const valores = Object.values(mix);
  if (valores.some((v) => typeof v !== 'number' || v < 0 || isNaN(v))) {
    return {
      valido: false,
      somaAtual: 0,
      diferenca: barrisTotal,
      mensagem: 'Quantidades de barris não podem ser negativas ou indefinidas.',
    };
  }

  const somaAtual = somarBarrisMix(mix);
  const diferenca = barrisTotal - somaAtual;

  if (somaAtual === barrisTotal) {
    return { valido: true, somaAtual, diferenca: 0 };
  }

  if (somaAtual < barrisTotal) {
    return {
      valido: false,
      somaAtual,
      diferenca,
      mensagem: `Faltam ${diferenca} ${diferenca === 1 ? 'barril' : 'barris'} para completar o total escolhido de ${barrisTotal}.`,
    };
  }

  const absDiferenca = Math.abs(diferenca);
  return {
    valido: false,
    somaAtual,
    diferenca,
    mensagem: `O mix possui ${absDiferenca} ${absDiferenca === 1 ? 'barril' : 'barris'} a mais que o total contratado (${barrisTotal}).`,
  };
}

/**
 * Gera a sugestão de mix de estilos Albanos de acordo com a quantidade total de barris.
 * Regras vigentes da documentação:
 * - 1 barril: apresentar opções antes de pressupor Pilsen (sugestão neutra: 1 Pilsen).
 * - 2 barris: sugestão preferencial 1 Pilsen + 1 Session IPA.
 * - 3 barris: priorizar três estilos diferentes: 1 Pilsen + 1 Session IPA + 1 terceiro estilo (Amber).
 * - 4 ou mais: aproximadamente 50% Pilsen + 50% outros estilos, incluindo Session IPA.
 */
export function sugerirMix(barrisTotal: number): MixBarris {
  const sugestao: MixBarris = { ...MIX_ZERADO };

  if (barrisTotal <= 0) return sugestao;

  if (barrisTotal === 1) {
    sugestao.pilsen = 1;
    return sugestao;
  }

  if (barrisTotal === 2) {
    sugestao.pilsen = 1;
    sugestao.session_ipa = 1;
    return sugestao;
  }

  if (barrisTotal === 3) {
    sugestao.pilsen = 1;
    sugestao.session_ipa = 1;
    sugestao.amber = 1;
    return sugestao;
  }

  // 4 ou mais barris: ~50% Pilsen + 50% outros estilos (priorizando Session IPA)
  const pilsenQtd = Math.ceil(barrisTotal * 0.5);
  let restante = barrisTotal - pilsenQtd;

  sugestao.pilsen = pilsenQtd;

  if (restante > 0) {
    sugestao.session_ipa = Math.ceil(restante * 0.5);
    restante -= sugestao.session_ipa;
  }
  if (restante > 0) {
    sugestao.amber = Math.ceil(restante * 0.5);
    restante -= sugestao.amber;
  }
  if (restante > 0) {
    sugestao.american_ipa = restante;
  }

  return sugestao;
}

/**
 * Retorna um resumo legível do mix de barris para exibição e mensagens wa.me.
 */
export function formatarResumoMix(mix: MixBarris): string {
  const partes: string[] = [];
  if (mix.pilsen > 0) partes.push(`${mix.pilsen} Pilsen`);
  if (mix.session_ipa > 0) partes.push(`${mix.session_ipa} Session IPA`);
  if (mix.amber > 0) partes.push(`${mix.amber} Amber`);
  if (mix.life_lager > 0) partes.push(`${mix.life_lager} Life Lager`);
  if (mix.american_ipa > 0) partes.push(`${mix.american_ipa} American IPA`);
  if (mix.pale_ale > 0) partes.push(`${mix.pale_ale} Pale Ale`);

  return partes.length > 0 ? partes.join(' + ') : 'Nenhum estilo selecionado';
}
