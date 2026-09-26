/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Modal Interativo de Execução e Auditoria dos Testes V1.1
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  X,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';
import { executarTodosOsTestes, TestResultItem } from '../businessRules/tests/engineTests';

interface EngineTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineTestRunnerModal: React.FC<EngineTestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [resultados, setResultados] = useState<{
    total: number;
    passou: number;
    falhou: number;
    itens: TestResultItem[];
  } | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('TODAS');

  if (!isOpen) return null;

  const handleRodarTestes = () => {
    const res = executarTodosOsTestes();
    setResultados(res);
  };

  const itensFiltrados = resultados
    ? categoriaAtiva === 'TODAS'
      ? resultados.itens
      : resultados.itens.filter((item) => item.categoria === categoriaAtiva)
    : [];

  const categorias = resultados
    ? ['TODAS', ...Array.from(new Set(resultados.itens.map((i) => i.categoria)))]
    : [];

  return (
    <div
      id="modal-test-runner"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-auditoria-testes"
    >
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-stone-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="titulo-auditoria-testes" className="text-lg font-bold text-white">
                  Auditoria Técnica do Motor Determinístico
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-800/60">
                  V1.1
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Execução dos casos-âncora D-01..D-07, Q-01..Q-04, M-01..M-04, O-01..O-05, I-01..I-05
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & Summary */}
        <div className="py-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRodarTestes}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-lg shadow-amber-950"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {resultados ? 'Executar Novamente' : 'Executar Todos os Testes'}
            </button>
            {resultados && (
              <button
                onClick={() => setResultados(null)}
                className="p-2 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs transition"
                title="Limpar resultados"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {resultados && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {resultados.passou} passaram
              </span>
              {resultados.falhou > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-800/60 text-rose-400">
                  <XCircle className="w-3.5 h-3.5" />
                  {resultados.falhou} falharam
                </span>
              )}
              <span className="text-stone-400">Total: {resultados.total}</span>
            </div>
          )}
        </div>

        {/* Filter categories tabs */}
        {resultados && (
          <div className="flex items-center gap-1.5 py-3 overflow-x-auto text-xs border-b border-stone-800/50">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                  categoriaAtiva === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* List of Test Results */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {!resultados ? (
            <div className="text-center py-16 text-stone-500">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
              <p className="text-sm text-stone-300 font-medium">Suíte pronta para verificação</p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Clique no botão "Executar Todos os Testes" para auditar o motor matemático, cenários de barris, invariantes de mix, regras de frete e pseudo-integração.
              </p>
            </div>
          ) : (
            itensFiltrados.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border text-xs transition ${
                  item.passou
                    ? 'bg-stone-950/70 border-stone-800/80 hover:border-emerald-700/50'
                    : 'bg-rose-950/20 border-rose-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        item.passou
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                      }`}
                    >
                      {item.id}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider">
                      {item.categoria}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.passou ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PASSOU
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        FALHOU
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-medium text-stone-200 mb-2">{item.descricao}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-900/90 p-2.5 rounded-lg font-mono text-[11px] border border-stone-800">
                  <div>
                    <span className="text-stone-500 block text-[10px]">ESPERADO:</span>
                    <span className="text-stone-300 font-semibold">{item.esperado}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">OBTIDO:</span>
                    <span className={item.passou ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {item.obtido}
                    </span>
                  </div>
                </div>

                {item.detalhe && (
                  <div className="mt-2 text-[10px] text-stone-400 italic">
                    Nota: {item.detalhe}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Dry Run Albanos + Forno: Rigor nas regras & Determinismo</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
