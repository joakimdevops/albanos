/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Modal de Confirmação de Reinício ("Modo Fábrica") V1.1
 */

import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-confirmar-reset"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-reiniciar"
      aria-describedby="descricao-modal-reiniciar"
    >
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-stone-100 overflow-hidden">
        {/* Detalhe superior da Cervejaria Albanos */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <img
              src="https://i.postimg.cc/NFnKrBLb/logo-albanos-SO-LOGO-SEM-FUNDO-3.png"
              alt="Cervejaria Albanos"
              className="h-8 w-auto object-contain filter drop-shadow-[0_2px_6px_rgba(193,160,27,0.3)]"
            />
            <div>
              <h3
                id="titulo-modal-reiniciar"
                className="text-base sm:text-lg font-bold text-white font-['Raleway',sans-serif]"
              >
                Reiniciar Calculadora
              </h3>
              <p className="text-[11px] text-stone-400">
                Cervejaria Albanos • Restauração de Modo Fábrica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Alerta Crítico */}
        <div className="py-5 space-y-4 text-sm">
          {/* Card de Aviso com Ícone */}
          <div className="p-4 bg-amber-950/40 border border-amber-600/50 rounded-xl text-amber-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 shrink-0 mt-0.5 border border-amber-600/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-amber-300 block text-sm">
                Tem certeza?
              </span>
              <p id="descricao-modal-reiniciar" className="text-xs text-amber-100/90 leading-relaxed font-medium">
                Todos os dados informados serão perdidos! Essa ação é irreversível.
              </p>
            </div>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            Ao confirmar, todas as preferências, convidados, mix de estilos e orçamento calculado
            serão apagados da memória e o aplicativo será recarregado na página inicial em{' '}
            <strong className="text-amber-400">modo de fábrica</strong> (dados 100% zerados e estado original).
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="pt-3 border-t border-stone-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-semibold transition"
          >
            Cancelar e continuar
          </button>
          <button
            id="btn-confirmar-reset-modo-fabrica"
            type="button"
            onClick={onConfirmReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-red-950/60 transition active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Sim, zerar dados e recomeçar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
