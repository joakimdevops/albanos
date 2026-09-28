/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Header e Barra de Navegação Progressiva V1.1
 */

import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';

interface HeaderNavProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  canGoBack: boolean;
  onBack: () => void;
  onOpenAudit?: () => void;
  onRestart?: () => void;
  onOpenWhatsAppHelp?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  canGoBack,
  onBack,
  onRestart,
  onOpenWhatsAppHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Lado Esquerdo: Logo Albanos como detalhe no canto superior esquerdo + Voltar */}
        <div className="flex items-center gap-2.5">
          {/* Logo Albanos no canto superior esquerdo */}
          <div
            onClick={onRestart}
            className="flex items-center gap-2 select-none cursor-pointer group"
            title="Cervejaria Albanos • Início"
          >
            <img
              src="https://i.postimg.cc/NFnKrBLb/logo-albanos-SO-LOGO-SEM-FUNDO-3.png"
              alt="Logo Cervejaria Albanos"
              className="h-8 sm:h-9 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(193,160,27,0.35)] transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-xs tracking-wider text-amber-400 font-['Raleway',sans-serif]">
                ALBANOS
              </span>
              <span className="text-[9px] text-stone-400 uppercase tracking-widest">
                CALCULADORA
              </span>
            </div>
          </div>

          {/* Botão Voltar se puder retroceder */}
          {canGoBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-900 transition flex items-center gap-1 text-xs"
              aria-label="Voltar à etapa anterior"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Voltar</span>
            </button>
          )}

          {/* Título da Etapa Atual */}
          {currentStep > 0 && currentStep <= totalSteps && (
            <div className="ml-1 text-xs border-l border-stone-800/80 pl-2.5">
              <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                Etapa {currentStep} de {totalSteps}
              </span>
              <span className="font-semibold text-stone-200 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs block">
                {stepTitle}
              </span>
            </div>
          )}
        </div>

        {/* Lado Direito: Atendimento direto no WhatsApp a qualquer momento (Ícone Oficial WhatsApp) */}
        <div className="flex items-center gap-2">
          {onOpenWhatsAppHelp && (
            <button
              type="button"
              onClick={onOpenWhatsAppHelp}
              className="p-2 sm:p-2.5 rounded-xl bg-[#0c443c]/70 hover:bg-[#125e53]/90 border border-[#155e53]/80 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 transition-all duration-200 shadow-md shadow-[#0c443c]/40 hover:shadow-[#0c443c]/60 cursor-pointer active:scale-95 group flex items-center justify-center"
              title="Dúvidas? Fale conosco no WhatsApp!"
              aria-label="Dúvidas? Fale conosco no WhatsApp!"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6 fill-current transition-transform duration-200 group-hover:scale-110 shrink-0"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Progresso Fina no Topo */}
      {currentStep > 0 && currentStep <= totalSteps && (
        <div className="w-full bg-stone-900 h-1 mt-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      )}
    </header>
  );
};
