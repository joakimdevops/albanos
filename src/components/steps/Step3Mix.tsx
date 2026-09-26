/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T5: Portfólio e Mix de Estilos V1.1
 */

import React, { useState, useEffect } from 'react';
import {
  Beer,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { CalculatorState, EstiloChope, MixBarris } from '../../types';
import { LISTA_ESTILOS } from '../../businessRules/domainConfig';
import { somarBarrisMix, sugerirMix, validarInvarianteMix } from '../../businessRules/mixEngine';
import { formatarMoeda } from '../../businessRules/budgetEngine';

interface Step3MixProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3Mix: React.FC<Step3MixProps> = ({
  state,
  onUpdateField,
  onNext,
  onBack,
}) => {
  const barrisTotal = state.barris_total_escolhidos || 3;
  const mixAtual = state.mix;

  // Garante que o mix exista na inicialização com todos os estilos zerados
  useEffect(() => {
    if (!state.mix) {
      onUpdateField('mix', {
        pilsen: 0,
        life_lager: 0,
        session_ipa: 0,
        amber: 0,
        american_ipa: 0,
        pale_ale: 0,
      });
    }
  }, []);

  const validacao = validarInvarianteMix(mixAtual, barrisTotal);
  const isExcesso = validacao.somaAtual > barrisTotal;
  const barrisAMais = validacao.somaAtual - barrisTotal;

  const handleAlterarEstilo = (estilo: EstiloChope, delta: number) => {
    const atual = mixAtual[estilo] || 0;
    const novoValor = Math.max(0, atual + delta);
    const novoMix: MixBarris = {
      ...mixAtual,
      [estilo]: novoValor,
    };
    onUpdateField('mix', novoMix);
  };

  const handleAplicarSugestao = () => {
    const sugestao = sugerirMix(barrisTotal);
    onUpdateField('mix', sugestao);
  };

  const handleAvancarMix = () => {
    if (!validacao.valido) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      setTimeout(() => {
        const el = document.getElementById('status-invariante-mix') || document.getElementById('step-mix');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }
    onNext();
  };

  return (
    <div id="step-mix" className="max-w-2xl mx-auto space-y-6 py-4 px-4">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 3 de 8 • Portfólio & Mix de Chope
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Distribua seus {barrisTotal} barris
        </h2>
        <p className="text-xs text-stone-400">
          Escolha seus estilos preferidos ou aceite a sugestão do mestre cervejeiro da Albanos.
        </p>
        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleAplicarSugestao}
            className="relative overflow-hidden group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-850 text-stone-200 hover:text-amber-200 text-xs font-medium border border-amber-500/30 hover:border-amber-500/70 shadow-sm hover:shadow-[0_0_18px_rgba(245,158,11,0.25)] transition-all duration-300 active:scale-95 cursor-pointer before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-amber-400/25 before:to-transparent before:transition-transform before:duration-700 before:ease-in-out"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
            <span className="font-semibold tracking-wide">Aplicar sugestão do mestre cervejeiro</span>
          </button>
        </div>
      </div>

      {/* Barra de Status do Invariante de Barris */}
      <div
        id="status-invariante-mix"
        className={`scroll-mt-20 p-4 rounded-xl border flex flex-col gap-3 transition ${
          validacao.valido
            ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
            : isExcesso
            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
            : 'bg-amber-950/30 border-amber-600/50 text-amber-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {validacao.valido ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold">
                {validacao.valido
                  ? 'Mix Completo e Balanceado!'
                  : isExcesso
                  ? 'Limite de barris excedido'
                  : `Ajuste o mix: ${validacao.mensagem}`}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Distribuído: {validacao.somaAtual} de {barrisTotal} barris (50 L cada)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="font-mono font-bold text-base">
              {validacao.somaAtual} / {barrisTotal}
            </span>
            <span className="text-xs opacity-75">barris</span>
          </div>
        </div>

        {/* Aviso quando o usuário selecionar mais barris que o contratado/estimado na etapa anterior */}
        {isExcesso && (
          <div className="pt-3 border-t border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed text-amber-100">
            <p className="flex-1">
              Você selecionou {barrisAMais} {barrisAMais === 1 ? 'barril' : 'barris'} a mais que o contratado/estimado na etapa anterior. Ajuste o mix de estilos escolhidos abaixo, ou volte à etapa anterior para ajustar a quantidade de barris desejada.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Voltar</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid com os 6 Estilos Canônicos Albanos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {LISTA_ESTILOS.map((estilo) => {
          const quantidade = mixAtual[estilo.id] || 0;
          const isAtivo = quantidade > 0;

          return (
            <div
              key={estilo.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                isAtivo
                  ? 'bg-stone-900 border-amber-500/60 shadow-lg shadow-black/40'
                  : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div>
                {/* Header do Estilo */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-white text-sm tracking-wide">
                        {estilo.nome}
                      </h3>
                      {estilo.isPremiado && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                          <Award className="w-3 h-3 text-amber-400" />
                          Premiada
                        </span>
                      )}
                    </div>
                    {/* Estilo Técnico */}
                    <div className="text-[11px] text-amber-400/90 font-medium">
                      {estilo.estiloTecnico}
                    </div>
                    <div className="text-xs font-mono text-amber-400 font-semibold mt-0.5">
                      {formatarMoeda(estilo.precoUnitario)}
                      <span className="text-[10px] text-stone-400 font-normal"> / barril 50 L</span>
                    </div>
                  </div>

                  {/* Informações Técnicas: ABV e IBU */}
                  <div className="flex flex-col items-end gap-1 text-[10px] font-mono shrink-0">
                    <span className="bg-stone-900/90 text-stone-300 px-2 py-0.5 rounded border border-stone-800">
                      ABV <strong className="text-amber-300 font-semibold">{estilo.abv}</strong>
                    </span>
                    <span className="bg-stone-900/90 text-stone-300 px-2 py-0.5 rounded border border-stone-800">
                      IBU <strong className="text-amber-300 font-semibold">{estilo.ibu}</strong>
                    </span>
                  </div>
                </div>

                {/* Perfil Sensorial Oficial fornecido pelo mestre cervejeiro */}
                <div className="mb-4 bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                    Perfil Sensorial:
                  </span>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {estilo.perfilSensorial}
                  </p>
                </div>
              </div>

              {/* Controles de Quantidade */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  Subtotal: <strong className="text-stone-200">{formatarMoeda(quantidade * estilo.precoUnitario)}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAlterarEstilo(estilo.id, -1)}
                    disabled={quantidade <= 0}
                    className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-700 disabled:opacity-25 text-stone-200 font-bold hover:bg-stone-800 transition flex items-center justify-center"
                    aria-label={`Remover 1 barril de ${estilo.nome}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-7 text-center font-mono font-bold text-sm text-amber-300">
                    {quantidade}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAlterarEstilo(estilo.id, 1)}
                    className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 font-bold hover:bg-stone-800 transition flex items-center justify-center"
                    aria-label={`Adicionar 1 barril de ${estilo.nome}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
          id="btn-avancar-equipamentos"
          onClick={handleAvancarMix}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
            validacao.valido
              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-amber-950 cursor-pointer'
              : 'bg-stone-800 text-amber-300/80 border border-amber-500/30 hover:bg-stone-700'
          }`}
        >
          <span>Confirmar Mix e Avançar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
