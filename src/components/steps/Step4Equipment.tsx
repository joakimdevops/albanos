/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T6: Equipamentos (Chopeira e Gás) V1.1
 */

import React from 'react';
import { Zap, Gauge, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { CalculatorState } from '../../types';

interface Step4EquipmentProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Equipment: React.FC<Step4EquipmentProps> = ({
  state,
  onUpdateField,
  onNext,
  onBack,
}) => {
  return (
    <div id="step-equipamentos" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 4 de 8 • Equipamentos
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Chopeiras e Gás para Extração
        </h2>
        <p className="text-xs text-stone-400">
          Informe se você vai precisar de empréstimo de chopeira elétrica e gás para extração do chope.
        </p>
      </div>

      <div className="space-y-4">
        {/* Chopeira */}
        <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Precisa de Chopeira?</h3>
                <p className="text-xs text-stone-400">
                  Equipamento elétrico profissional Albanos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-lg border border-stone-800">
              <button
                type="button"
                onClick={() => onUpdateField('precisa_chopeira', false)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  !state.precisa_chopeira
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => onUpdateField('precisa_chopeira', true)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  state.precisa_chopeira
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Sim
              </button>
            </div>
          </div>

          {state.precisa_chopeira && (
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 text-xs text-stone-300 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-white">
                  Chopeira elétrica solicitada
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800/60 text-emerald-400 shrink-0 self-start">
                Inclusa
              </span>
            </div>
          )}
        </div>

        {/* Cilindro de Gás (CO2) */}
        <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Precisa de Cilindro de Gás (CO2)?</h3>
                <p className="text-xs text-stone-400">
                  Necessário para a pressurização e extração perfeita do chope
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-lg border border-stone-800">
              <button
                type="button"
                onClick={() => onUpdateField('precisa_gas', false)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  !state.precisa_gas
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => onUpdateField('precisa_gas', true)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  state.precisa_gas
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Sim
              </button>
            </div>
          </div>

          {state.precisa_gas && (
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 text-xs text-stone-300 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Cilindro de Gás (CO2) solicitado</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800/60 text-emerald-400">
                Incluso
              </span>
            </div>
          )}
        </div>

        {/* Nota Operacional Importante */}
        <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            O empréstimo dos equipamentos está sujeito a disponibilidade que será confirmada pelo time da logística após a conclusão do orçamento.
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="pt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-medium transition"
        >
          Voltar
        </button>

        <button
          type="button"
          id="btn-avancar-logistica"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-950"
        >
          <span>Continuar para Logística</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
