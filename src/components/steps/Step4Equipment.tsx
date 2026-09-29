/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T6: Equipamentos (Chopeira e Gás) V1.1
 */

import React, { useState } from 'react';
import { Zap, Gauge, ArrowRight, CheckCircle2, Info, AlertCircle } from 'lucide-react';
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
  const [erroEquip, setErroEquip] = useState<string | null>(null);

  const respostasCompletas =
    typeof state.precisa_chopeira === 'boolean' && typeof state.precisa_gas === 'boolean';

  const handleAvancar = () => {
    if (!respostasCompletas) {
      setErroEquip('Por favor, responda se você precisa de chopeira e de cilindro de gás para continuar.');
      return;
    }
    onNext();
  };

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
                onClick={() => {
                  setErroEquip(null);
                  onUpdateField('precisa_chopeira', false);
                }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  state.precisa_chopeira === false
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  setErroEquip(null);
                  onUpdateField('precisa_chopeira', true);
                }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  state.precisa_chopeira === true
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Sim
              </button>
            </div>
          </div>

          {state.precisa_chopeira === true && (
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 text-xs text-stone-300 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-white block">
                  Chopeira elétrica Albanos solicitada
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  Disponibilidade e voltagem serão confirmadas pelo Time Comercial Albanos.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-800/60 text-amber-400 shrink-0 self-start">
                A confirmar
              </span>
            </div>
          )}

          {state.precisa_chopeira === false && (
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 text-xs text-stone-400">
              Utilizará chopeira própria ou estrutura do local do evento.
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
                onClick={() => {
                  setErroEquip(null);
                  onUpdateField('precisa_gas', false);
                }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  state.precisa_gas === false
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  setErroEquip(null);
                  onUpdateField('precisa_gas', true);
                }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  state.precisa_gas === true
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Sim
              </button>
            </div>
          </div>

          {state.precisa_gas === true && (
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 text-xs text-stone-300 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-white block">Cilindro de Gás (CO2) solicitado</span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  Disponibilidade confirmada pela equipe junto aos barris.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-800/60 text-amber-400 shrink-0 self-start">
                A confirmar
              </span>
            </div>
          )}

          {state.precisa_gas === false && (
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 text-xs text-stone-400">
              Utilizará gás próprio ou estrutura do local do evento.
            </div>
          )}
        </div>

        {erroEquip && (
          <div className="p-3 bg-rose-950/40 border border-rose-600/50 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{erroEquip}</span>
          </div>
        )}

        {/* Nota Operacional Importante */}
        <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            O empréstimo dos equipamentos está sujeito à disponibilidade que será confirmada pelo time de logística após o encaminhamento da cotação.
          </div>
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
          id="btn-avancar-logistica"
          onClick={handleAvancar}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
            respostasCompletas
              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-amber-950 cursor-pointer active:scale-95'
              : 'bg-stone-800 text-stone-400 border border-stone-700 cursor-not-allowed opacity-80'
          }`}
        >
          <span>Continuar para Logística</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
