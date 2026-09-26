/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Modal de Transparência de Cálculo V1.1
 */

import React from 'react';
import { X, HelpCircle, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { CalculatorState } from '../types';
import { BARRIL_VOLUME_LITROS, ZONA_JUSTA_LITROS } from '../businessRules/domainConfig';

interface CalculationExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CalculatorState;
}

export const CalculationExplanationModal: React.FC<CalculationExplanationModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  if (!isOpen) return null;

  const adultos = state.qtd_adultos || 0;
  const duracao = state.duracao_horas || 0;
  const comOutra = state.outras_bebidas_alcoolicas === 'SIM';
  const fator = state.fator_consumo_usado || (comOutra ? 1.2 : 1.5);
  const litrosEstimados = state.litros_estimados || 0;
  const barris = state.barris_total_escolhidos || 0;
  const litrosComerciais = barris * BARRIL_VOLUME_LITROS;
  const diferenca = Number((litrosComerciais - litrosEstimados).toFixed(2));

  return (
    <div
      id="modal-explicacao-calculo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-explicacao-calculo"
    >
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-stone-100 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <img
              src="https://i.postimg.cc/NFnKrBLb/logo-albanos-SO-LOGO-SEM-FUNDO-3.png"
              alt="Cervejaria Albanos"
              className="h-8 w-auto object-contain filter drop-shadow-[0_2px_6px_rgba(193,160,27,0.3)]"
            />
            <div>
              <h3 id="titulo-explicacao-calculo" className="text-base sm:text-lg font-bold text-white font-['Raleway',sans-serif]">
                Como chegamos a esse cálculo?
              </h3>
              <p className="text-xs text-stone-400">
                Lógica determinística da Cervejaria Albanos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            aria-label="Fechar explicação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 py-4 text-sm">
          {/* Parâmetros do Evento */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              1. Entradas do seu evento
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                <span className="text-stone-400 block">Adultos previstos:</span>
                <span className="font-bold text-white text-base">{adultos} pessoas</span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                <span className="text-stone-400 block">Duração do evento:</span>
                <span className="font-bold text-white text-base">{duracao} horas</span>
              </div>
            </div>
            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800 text-xs">
              <span className="text-stone-400">Haverá outras bebidas alcoólicas (destilados, vinho, etc.)?</span>
              <div className="font-semibold text-amber-200 mt-0.5">
                {comOutra ? 'Sim (consumo estimado de chope é menor)' : 'Não (somente chope)'}
              </div>
            </div>
          </div>

          {/* Fator e Fórmula */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              2. Fator determinístico de consumo
            </h4>
            <p className="text-xs text-stone-300">
              Para {duracao} horas {comOutra ? 'com outra bebida alcoólica' : 'somente com chope'}, nossa tabela técnica define o fator de consumo de:
            </p>
            <div className="inline-block px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-300 font-mono font-bold text-sm">
              {fator.toFixed(2)} Litros por adulto
            </div>

            <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 font-mono text-xs text-stone-300">
              <div className="text-stone-400 text-[11px] mb-1">Fórmula Oficial:</div>
              <div>litros_estimados = adultos × fator_da_faixa</div>
              <div className="text-amber-400 font-semibold mt-1">
                {adultos} × {fator.toFixed(2)} = {litrosEstimados} Litros
              </div>
            </div>
          </div>

          {/* Conversão em barris */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              3. Conversão para Barris Comerciais (50 L)
            </h4>
            <p className="text-xs text-stone-300">
              O chope oficial Albanos é disponibilizado exclusivamente em barris lacrados de <strong>50 Litros</strong>.
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-stone-300">Referência Matemática:</span>
                <span className="font-mono font-bold text-white">{litrosEstimados} L</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-stone-300">Volume Comercial Escolhido:</span>
                <span className="font-mono font-bold text-amber-300">
                  {barris} barris = {litrosComerciais} L
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-stone-300">Margem / Diferença:</span>
                <span className={`font-mono font-bold ${diferenca >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {diferenca > 0 ? `+${diferenca} L (sobra de segurança)` : diferenca < 0 ? `${diferenca} L (enxuto)` : 'Exato (0 L)'}
                </span>
              </div>
            </div>

            {/* Explicação da Zona Justa */}
            <div className="mt-3 p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 text-[11px] text-stone-400">
              <span className="text-stone-200 font-semibold block mb-0.5">Regra da Zona Justa (± 10 L):</span>
              Quando o volume de barris fica a até 10 L da referência matemática calculada, consideramos o cenário ideal <strong>JUSTO</strong>. Fora dessa faixa, apresentamos os cenários <strong>ENXUTO</strong> (abaixo) e <strong>ABUNDANTE</strong> (com folga confortável) para sua escolha autônoma.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
