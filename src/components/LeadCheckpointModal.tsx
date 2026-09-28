/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Modal de Checkpoint de Preservação do Lead V1.1
 */

import React from 'react';
import { MessageSquare, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CalculatorState } from '../types';
import { gerarLinkWhatsApp } from '../businessRules/whatsappAdapter';

interface LeadCheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CalculatorState;
  currentStep?: number;
  stepTitle?: string;
}

export const LeadCheckpointModal: React.FC<LeadCheckpointModalProps> = ({
  isOpen,
  onClose,
  state,
  currentStep,
  stepTitle,
}) => {
  if (!isOpen) return null;

  const linkWhatsApp = gerarLinkWhatsApp(state, 'preventivo', undefined, currentStep, stepTitle);

  return (
    <div
      id="modal-preservar-lead"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-preservar-lead"
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
            <h3 id="titulo-preservar-lead" className="text-base sm:text-lg font-bold text-white font-['Raleway',sans-serif] leading-tight">
              Prefere seguir com seu atendimento pelo WhatsApp?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition shrink-0 ml-2"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 text-sm">
          <div className="p-4 bg-gradient-to-r from-[#0c443c]/50 via-stone-900 to-[#082d28]/40 border border-[#0c443c] ring-1 ring-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-200 flex items-start gap-3 shadow-md shadow-[#0c443c]/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-300 block text-sm">
                Não vamos recomeçar do zero!
              </span>
              <p className="text-xs text-stone-200 leading-relaxed">
                O time Albanos vai dar continuidade imediata à sua solicitação exatamente de onde paramos aqui.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-medium transition cursor-pointer"
          >
            Continuar por aqui mesmo
          </button>
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Seguir no WhatsApp!
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
