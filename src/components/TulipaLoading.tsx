/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Indicador Lúdico de Loading com Tulipa de Chope V1.1
 */

import React, { useEffect, useState } from 'react';

export interface FraseLoading {
  id: string;
  minPct: number;
  maxPct: number;
  frase: string;
}

export interface TulipaLoadingProps {
  onComplete?: () => void;
  duracaoMs?: number;
  titulo?: string;
  subtitulo?: string;
  frases?: FraseLoading[];
  textoPular?: string;
}

const FRASES_LOADING: FraseLoading[] = [
  {
    id: 'temp',
    minPct: 0,
    maxPct: 18,
    frase: 'Verificando temperatura (-1.5°C)...',
  },
  {
    id: 'estilo',
    minPct: 18,
    maxPct: 38,
    frase: 'Escolhendo seu estilo preferido...',
  },
  {
    id: 'tulipa',
    minPct: 38,
    maxPct: 58,
    frase: 'Providenciando a tulipa ideal de cristal...',
  },
  {
    id: 'extracao',
    minPct: 58,
    maxPct: 78,
    frase: 'Extraindo chope com fluxo perfeito...',
  },
  {
    id: 'colarinho',
    minPct: 78,
    maxPct: 94,
    frase: 'Ajustando colarinho cremoso de dois dedos...',
  },
  {
    id: 'pronto',
    minPct: 94,
    maxPct: 100,
    frase: 'Tá na mão! Saúde! 🍻',
  },
];

export const TulipaLoading: React.FC<TulipaLoadingProps> = ({
  onComplete,
  duracaoMs = 6400,
  titulo = "Albano's Chopp Calculator",
  subtitulo = "Preparando o melhor chope para o seu evento...",
  frases = FRASES_LOADING,
  textoPular = "Pular introdução →",
}) => {
  const [progresso, setProgresso] = useState<number>(0);

  useEffect(() => {
    const inicio = Date.now();
    const interval = setInterval(() => {
      const decorrido = Date.now() - inicio;
      const pct = Math.min(100, Math.round((decorrido / duracaoMs) * 100));
      setProgresso(pct);

      if (pct >= 100) {
        clearInterval(interval);
        if (onComplete) {
          setTimeout(onComplete, 600);
        }
      }
    }, 25);

    return () => clearInterval(interval);
  }, [duracaoMs, onComplete]);

  const comandoAtual =
    frases.find((f) => progresso >= f.minPct && progresso < f.maxPct) ||
    frases[frases.length - 1];

  return (
    <div
      id="tulipa-loading-container"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950/95 backdrop-blur-md p-6 text-stone-100"
      role="status"
      aria-live="polite"
      aria-label="Carregando Albano's Chopp Calculator"
    >
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <img
            src="https://i.postimg.cc/NFnKrBLb/logo-albanos-SO-LOGO-SEM-FUNDO-3.png"
            alt="Cervejaria Albanos"
            className="h-14 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(193,160,27,0.45)]"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/40 text-amber-300 text-xs tracking-wider uppercase font-semibold mb-2">
          <span>Cervejaria Albanos</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-['Raleway',sans-serif]">
          {titulo}
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          {subtitulo}
        </p>
      </div>

      {/* SVG Tulipa de Chope em Formato Triangular Animada */}
      <div className="relative w-44 h-64 flex items-center justify-center">
        <svg
          viewBox="0 0 100 160"
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(193,160,27,0.3)]"
          aria-hidden="true"
        >
          <defs>
            {/* Gradiente Dourado Âmbar Cerveja Albanos harmonizado com a Logo (#c1a01b) */}
            <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d6b527" />
              <stop offset="35%" stopColor="#e5cb58" />
              <stop offset="70%" stopColor="#c1a01b" />
              <stop offset="100%" stopColor="#9e8214" />
            </linearGradient>

            {/* Gradiente Espuma Cremosa */}
            <linearGradient id="foamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="80%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>

            {/* Máscara interna da tulipa em formato triangular (cone V invertido alongado até a base) */}
            <clipPath id="glassInner">
              <path d="M 19 22 Q 50 18.5 81 22 L 53.5 146 Q 50 148.5 46.5 146 Z" />
            </clipPath>
          </defs>

          {/* Base de Vidro (Pé Circular da Tulipa) */}
          <ellipse cx="50" cy="150" rx="30" ry="5.5" fill="rgba(255,255,255,0.12)" stroke="#8e8982" strokeWidth="1.6" />
          <ellipse cx="50" cy="150" rx="20" ry="3.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
          <ellipse cx="50" cy="149" rx="10" ry="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

          {/* Corpo do Copo / Cálice em Formato Triangular (V) alongado diretamente até a base */}
          <path
            d="M 17 21 Q 50 17 83 21 L 55 147 Q 50 150 45 147 Z"
            fill="rgba(25, 23, 20, 0.65)"
            stroke="#a8a29e"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Borda Superior do Vidro */}
          <ellipse cx="50" cy="21" rx="33" ry="3.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

          {/* Conteúdo Líquido mascarado pelo formato triangular alongado */}
          <g clipPath="url(#glassInner)">
            {/* Retângulo de líquido subindo */}
            {/* Altura útil da tulipa triangular: de y=146 (base) até y=22 (boca) = 124px */}
            <rect
              x="10"
              y={146 - (124 * progresso) / 100}
              width="80"
              height="145"
              fill="url(#liquidGradient)"
              className="transition-all duration-75 ease-out"
            />

            {/* Bolhas efervescentes subindo no formato cônico */}
            {progresso > 10 && (
              <g fill="rgba(255, 255, 255, 0.55)">
                <circle cx="47" cy={140 - (90 * progresso) / 100 + 8} r="1.5" className="animate-ping" />
                <circle cx="50" cy={140 - (80 * progresso) / 100 + 16} r="2" />
                <circle cx="54" cy={140 - (100 * progresso) / 100 + 24} r="1.5" />
                <circle cx="46" cy={140 - (70 * progresso) / 100 + 34} r="2" />
                <circle cx="52" cy={140 - (85 * progresso) / 100 + 44} r="1.2" />
              </g>
            )}

            {/* Colarinho de Espuma Branca Cremosa */}
            {progresso > 8 && (
              <g transform={`translate(0, ${146 - (124 * progresso) / 100 - 6})`}>
                <rect x="10" y="4" width="80" height="14" fill="url(#foamGradient)" />
                {/* Ondas decorativas de espuma no topo */}
                <circle cx="28" cy="4" r="5" fill="#ffffff" />
                <circle cx="39" cy="3" r="6" fill="#ffffff" />
                <circle cx="50" cy="2" r="6.5" fill="#ffffff" />
                <circle cx="61" cy="3" r="5.5" fill="#ffffff" />
                <circle cx="72" cy="4" r="4.5" fill="#ffffff" />
              </g>
            )}
          </g>

          {/* Brilho e Reflexo Triangular na Parede de Cristal Esquerda */}
          <path
            d="M 22 26 L 46 140"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Reflexo Sutil na Parede Direita */}
          <path
            d="M 78 26 L 54 140"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Porcentagem no centro */}
        <div className="absolute inset-0 flex items-center justify-center pt-5 pointer-events-none">
          <span className="text-xl font-bold font-mono tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {progresso}%
          </span>
        </div>
      </div>

      {/* Frase do comando em execução em fonte estilo terminal (sem caixa de terminal) */}
      <div className="mt-8 flex flex-col items-center justify-center min-h-[52px] px-4 text-center max-w-md w-full">
        <div
          key={comandoAtual.id}
          className="font-mono text-sm sm:text-base text-amber-300 font-semibold tracking-tight inline-flex items-center justify-center gap-2 transition-all duration-200"
        >
          <span className="text-amber-500 font-bold select-none">&gt;</span>
          <span>{comandoAtual.frase}</span>
          <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse select-none" />
        </div>
      </div>

      {/* Botão de Pular para conveniência */}
      {onComplete && (
        <button
          type="button"
          onClick={onComplete}
          className="mt-6 text-[11px] font-mono text-stone-500 hover:text-amber-400 transition-colors py-1.5 px-3.5 rounded-full border border-stone-800 hover:border-stone-700 bg-stone-900/50"
        >
          {textoPular}
        </button>
      )}
    </div>
  );
};
