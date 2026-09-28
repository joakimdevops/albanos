/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T3 & T4: Dimensionamento e Cenários V1.1
 */

import React, { useMemo, useState } from 'react';
import {
  Beer,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { CalculatorState, CenarioQuantidade } from '../../types';
import { calcularDimensionamento } from '../../businessRules/dimensioningEngine';
import { BARRIL_VOLUME_LITROS } from '../../businessRules/domainConfig';

interface Step2DimensioningProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onOpenExplanation: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Dimensioning: React.FC<Step2DimensioningProps> = ({
  state,
  onUpdateField,
  onOpenExplanation,
  onNext,
  onBack,
}) => {
  const [erroSelecao, setErroSelecao] = useState<string | null>(null);

  const dimensionamento = useMemo(() => {
    if (
      state.qtd_adultos &&
      state.qtd_adultos > 0 &&
      state.duracao_horas &&
      state.duracao_horas > 0 &&
      state.outras_bebidas_alcoolicas
    ) {
      return calcularDimensionamento(
        state.qtd_adultos,
        state.duracao_horas,
        state.outras_bebidas_alcoolicas
      );
    }
    return null;
  }, [state.qtd_adultos, state.duracao_horas, state.outras_bebidas_alcoolicas]);

  const litrosEstimados = dimensionamento?.litrosEstimados || state.litros_estimados || 0;
  const temEscolhaEfetiva = Boolean(state.barris_total_escolhidos && state.barris_total_escolhidos > 0);
  const barrisSelecionados = state.barris_total_escolhidos || 0;
  const litrosComerciais = barrisSelecionados * BARRIL_VOLUME_LITROS;

  const handleSelecionarCenario = (cenario: CenarioQuantidade, barris: number) => {
    setErroSelecao(null);
    onUpdateField('barris_total_escolhidos', barris);
    onUpdateField('cenario_quantidade', cenario);
  };

  const handleAlterarBarris = (delta: number) => {
    setErroSelecao(null);
    const base = state.barris_total_escolhidos || (dimensionamento?.cenariosDisponiveis[0]?.barris ?? 1);
    const novoTotal = Math.max(1, base + delta);
    onUpdateField('barris_total_escolhidos', novoTotal);
  };

  const handleAvancarParaMix = () => {
    if (!temEscolhaEfetiva) {
      setErroSelecao('Por favor, selecione um dos cenários comerciais acima para definir a quantidade de barris.');
      return;
    }
    onNext();
  };

  return (
    <div id="step-dimensionamento" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 2 de 8 • Dimensionamento & Cenários
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Recomendação de Chope Albanos
        </h2>
        <p className="text-xs text-stone-400">
          {state.evento_longo_ou_multiplos_dias
            ? `Cálculo referencial para ${state.qtd_adultos} adultos (evento > 12h ou múltiplos dias).`
            : `Cálculo sob medida para ${state.qtd_adultos} adultos durante ${state.duracao_horas}h.`}
        </p>
      </div>

      {state.evento_longo_ou_multiplos_dias && (
        <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="text-amber-300 block">Evento com mais de 12 horas ou em múltiplos dias</strong>
            <span>
              Para eventos de longa duração, não extrapolamos o consumo matematicamente. O dimensionamento abaixo serve como ponto de partida referencial e será ajustado pelo nosso time comercial no WhatsApp.
            </span>
          </div>
        </div>
      )}

      {/* Card de Referência Matemática */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 block">Consumo Matemático Estimado</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {litrosEstimados}
              </span>
              <span className="text-lg font-bold text-amber-400">Litros</span>
            </div>
          </div>

          {/* Botão de Transparência de Cálculo */}
          <button
            type="button"
            onClick={onOpenExplanation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Como calculamos?</span>
          </button>
        </div>

        <div className="text-[11px] text-stone-400 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 leading-relaxed">
          💡 Os barris oficiais Albanos são comercializados em unidades de <strong>50 Litros</strong>. Veja abaixo as opções comerciais recomendadas.
        </div>
      </div>

      {/* Cenários Comerciais Disponíveis */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
          Escolha seu cenário de barris
        </label>

        <div className="grid grid-cols-1 gap-3">
          {dimensionamento?.cenariosDisponiveis.map((cen) => {
            const isSelecionado = Boolean(
              state.barris_total_escolhidos &&
              state.barris_total_escolhidos === cen.barris &&
              (state.cenario_quantidade ? state.cenario_quantidade === cen.cenario : true)
            );
            const ehJusto = cen.cenario === 'JUSTO';
            const ehEnxuto = cen.cenario === 'ENXUTO';

            return (
              <button
                key={cen.cenario}
                type="button"
                onClick={() => handleSelecionarCenario(cen.cenario, cen.barris)}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  isSelecionado
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-white'
                    : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                {/* Badge do Cenário */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        ehJusto
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : ehEnxuto
                          ? 'bg-stone-800 text-stone-300 border border-stone-700'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {cen.cenario === 'JUSTO' && '⭐ Cenário Ideal (Justo)'}
                      {cen.cenario === 'ENXUTO' && '📉 Cenário Enxuto'}
                      {cen.cenario === 'ABUNDANTE' && '📈 Cenário Abundante'}
                    </span>
                  </div>

                  {isSelecionado && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Selecionado
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <span className="text-xl font-bold font-mono text-white">
                      {cen.barris} barris
                    </span>
                    <span className="text-xs text-stone-400 ml-2">
                      ({cen.litrosComerciais} Litros)
                    </span>
                  </div>

                  <span
                    className={`text-xs font-mono font-semibold ${
                      cen.diferencaLitros >= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {cen.diferencaLitros > 0
                      ? `+${cen.diferencaLitros} L da ref.`
                      : cen.diferencaLitros < 0
                      ? `${cen.diferencaLitros} L da ref.`
                      : 'Exato na ref.'}
                  </span>
                </div>

                <p className="text-[11px] text-stone-400 mt-2">
                  {cen.explicacao}
                </p>
              </button>
            );
          })}
        </div>

        {!temEscolhaEfetiva && (
          <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Por favor, escolha uma das opções acima (Enxuto ou Abundante) para definir a quantidade.</span>
          </div>
        )}

        {erroSelecao && (
          <div className="p-3 bg-rose-950/40 border border-rose-600/50 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{erroSelecao}</span>
          </div>
        )}
      </div>

      {/* Ajuste Fino de Barris */}
      <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-200 block">
            Ajustar quantidade total de barris
          </span>
          <span className="text-[11px] text-stone-400">
            {temEscolhaEfetiva
              ? `Total selecionado: ${barrisSelecionados} barris (${litrosComerciais} L)`
              : 'Selecione um cenário acima para habilitar o ajuste manual'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAlterarBarris(-1)}
            disabled={!temEscolhaEfetiva || barrisSelecionados <= 1}
            className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 disabled:opacity-30 text-stone-200 font-bold hover:bg-stone-800 transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="w-8 text-center font-mono font-bold text-sm text-amber-400">
            {temEscolhaEfetiva ? barrisSelecionados : '-'}
          </span>
          <button
            type="button"
            onClick={() => handleAlterarBarris(1)}
            disabled={!temEscolhaEfetiva}
            className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 disabled:opacity-30 text-stone-200 font-bold hover:bg-stone-800 transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Ações */}
      <div className="pt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-medium transition cursor-pointer"
        >
          Voltar
        </button>

        <button
          type="button"
          id="btn-avancar-mix"
          onClick={handleAvancarParaMix}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
            temEscolhaEfetiva
              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-amber-950 cursor-pointer active:scale-95'
              : 'bg-stone-800 text-stone-400 border border-stone-700 cursor-not-allowed opacity-80'
          }`}
        >
          <span>Escolher Estilos de Chope</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
