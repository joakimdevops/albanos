/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T1: Entrada V1.1 (Mobile-First / Primeira Dobra Otimizada)
 */

import React from 'react';
import {
  Beer,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronDown,
  Gauge,
  Sparkle,
} from 'lucide-react';

interface Step0EntryProps {
  onStart: () => void;
  onResume?: () => void;
  onClearSaved?: () => void;
  savedStep?: number;
  savedStepTitle?: string;
  hasSavedData?: boolean;
  onOpenAudit?: () => void;
}

export const Step0Entry: React.FC<Step0EntryProps> = ({
  onStart,
  onResume,
  onClearSaved,
  savedStep,
  savedStepTitle,
  hasSavedData,
}) => {
  const scrollToDetails = () => {
    const el = document.getElementById('detalhes-albanos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="step-entry" className="max-w-xl mx-auto px-4 py-2 sm:py-6 space-y-6 text-center">
      {/* =========================================================================
          PRIMEIRA DOBRA (ABOVE THE FOLD): Totalmente visível no mobile sem scroll
          ========================================================================= */}
      <section className="space-y-3.5 sm:space-y-4 pt-1 sm:pt-2">
        {/* Logo Albanos em Destaque */}
        <div className="flex justify-center">
          <img
            src="https://i.postimg.cc/NFnKrBLb/logo-albanos-SO-LOGO-SEM-FUNDO-3.png"
            alt="Cervejaria Albanos"
            className="h-20 sm:h-24 w-auto object-contain filter drop-shadow-[0_4px_20px_rgba(193,160,27,0.35)] transition-transform hover:scale-105 duration-300"
          />
        </div>

        {/* Badge Oficial Compacto */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-300 text-[11px] font-semibold tracking-wider uppercase select-none">
          <span>Cervejaria Albanos</span>
        </div>

        {/* Título Principal Compactado para Mobile */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-['Raleway',sans-serif] leading-tight">
            Calculadora de Chope
          </h1>
          <p className="text-xs sm:text-base text-stone-300 max-w-md mx-auto leading-relaxed">
            Calcule a quantidade exata de chope para o seu evento, escolha seus estilos preferidos e receba sua cotação em minutos.
          </p>
        </div>

        {/* CTA PRINCIPAL NA PRIMEIRA DOBRA: Touch target de 56px (WCAG friendly) */}
        <div className="pt-1 sm:pt-2 space-y-2.5 max-w-sm mx-auto w-full">
          {hasSavedData && savedStep && savedStep > 0 ? (
            <div className="space-y-2">
              <button
                id="btn-continuar-calculo"
                type="button"
                onClick={onResume}
                className="w-full flex items-center justify-center gap-2.5 h-14 px-5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm sm:text-base shadow-xl shadow-amber-950/60 transition active:scale-[0.98] border border-amber-400/40 cursor-pointer"
              >
                <span>Continuar ({savedStepTitle || `Etapa ${savedStep}`})</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                id="btn-recomecar-calculo"
                type="button"
                onClick={onClearSaved}
                className="text-xs text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-4 py-1"
              >
                Gerar uma nova cotação
              </button>
            </div>
          ) : (
            <button
              id="btn-iniciar-calculo"
              type="button"
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2.5 h-14 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-base shadow-xl shadow-amber-950/60 transition active:scale-[0.98] border border-amber-400/40 cursor-pointer"
            >
              <span>Calcular meu chope</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          <div className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Calcule a quantidade ideal e gere sua cotação em minutos.</span>
          </div>
        </div>

        {/* Indicador de continuidade para a segunda dobra */}
        <div className="pt-1">
          <button
            type="button"
            onClick={scrollToDetails}
            className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-amber-400 transition-colors py-1 px-2 select-none"
          >
            <span>Conheça as vantagens e como funciona</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-amber-500/70" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          SEGUNDA DOBRA (BELOW THE FOLD): Destaques, diferenciais e funcionamento
          ========================================================================= */}
      <section id="detalhes-albanos" className="pt-4 sm:pt-6 border-t border-stone-800/80 space-y-5 text-left">
        <div className="text-center space-y-1">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            Diferenciais Albanos
          </h2>
          <p className="text-base sm:text-lg font-bold text-white font-['Raleway',sans-serif]">
            Por que calcular com a Albanos?
          </p>
        </div>

        {/* 3 Cards de Destaques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800/90 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center mb-2 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-stone-200">Cálculo Preciso</div>
              <div className="text-[11px] text-stone-400 mt-1 leading-normal">
                Nosso algoritmo calcula a quantidade ideal de chope para o seu evento considerando quantidade de pessoas, horas de festa e outros fatores.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800/90 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center mb-2 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-stone-200">Estilos Premiados</div>
              <div className="text-[11px] text-stone-400 mt-1 leading-normal">
                Do tradicional Pilsen à premiada Session IPA, conheça os detalhes de cada estilo de chope Albanos e escolha seu preferido.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800/90 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center mb-2 text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-stone-200">Sem Burocracia</div>
              <div className="text-[11px] text-stone-400 mt-1 leading-normal">
                Uma ferramenta prática e divertida para você garantir o dimensionamento correto da quantidade de chope pro seu evento.
              </div>
            </div>
          </div>
        </div>

        {/* Como Funciona em 3 Passos */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c443c]/25 via-stone-900/70 to-stone-950 border border-[#0c443c]/40 space-y-3 shadow-md shadow-black/40">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 font-['Raleway',sans-serif]">
            <Gauge className="w-4 h-4 text-amber-400" />
            Como funciona em 3 passos simples
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <p className="text-stone-300">
                <strong className="text-white">Perfil do Evento:</strong> Informe o número de adultos, a duração do evento e se haverá outras bebidas alcoólicas.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <p className="text-stone-300">
                <strong className="text-white">Estilos & Equipamentos:</strong> Escolha os seus estilos preferidos e informe se vai necessitar dos equipamentos.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <p className="text-stone-300">
                <strong className="text-white">Cotação na hora:</strong> Gere sua cotação em poucos minutos e encaminhe sua solicitação para o time Albanos no WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Repetido na Segunda Dobra para Facilidade de Conversão */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onStart}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-sm transition"
          >
            <span>Gerar Cotação</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
