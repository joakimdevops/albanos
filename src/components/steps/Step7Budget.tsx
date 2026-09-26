/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T9, T10 & T11: Orçamento Auditável e Pagamento V1.1
 */

import React, { useMemo, useEffect, useState } from 'react';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  ArrowRight,
  Tag,
  X,
  AlertCircle,
} from 'lucide-react';
import { CalculatorState, FormaPagamento } from '../../types';
import { calcularOrcamento, formatarMoeda } from '../../businessRules/budgetEngine';

interface Step7BudgetProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onAcceptBudget: () => void;
  onPreserveLeadWhatsApp?: () => void;
  onBack: () => void;
}

export const Step7Budget: React.FC<Step7BudgetProps> = ({
  state,
  onUpdateField,
  onAcceptBudget,
  onBack,
}) => {
  // Garante que o orçamento esteja sempre calculado e reativo
  const orcamento = useMemo(() => {
    if (
      state.orcamento &&
      state.orcamento.invariantesValidos &&
      state.orcamento.itens &&
      state.orcamento.itens.length > 0
    ) {
      return state.orcamento;
    }
    const barris = state.barris_total_escolhidos || 0;
    if (barris > 0) {
      return calcularOrcamento({
        barrisTotal: barris,
        mix: state.mix,
        frete: state.frete,
        formaPagamento: state.forma_pagamento === 'A_DEFINIR' ? 'PIX' : state.forma_pagamento,
        parcelasCartao: state.parcelas_cartao,
        houveBarganha: state.houve_barganha,
      });
    }
    return state.orcamento;
  }, [
    state.orcamento,
    state.barris_total_escolhidos,
    state.mix,
    state.frete,
    state.forma_pagamento,
    state.parcelas_cartao,
    state.houve_barganha,
  ]);

  // Se o estado global ainda não tiver o objeto orçamento ou se forma de pagamento for A_DEFINIR, sincroniza
  useEffect(() => {
    if (orcamento && (!state.orcamento || !state.orcamento.itens?.length)) {
      onUpdateField('orcamento', orcamento);
    }
    if (state.forma_pagamento === 'A_DEFINIR') {
      onUpdateField('forma_pagamento', 'PIX');
    }
  }, [orcamento, state.orcamento, state.forma_pagamento, onUpdateField]);

  const formaPagamentoAtiva = state.forma_pagamento === 'A_DEFINIR' ? 'PIX' : state.forma_pagamento;

  const handleFormaPagamento = (forma: FormaPagamento) => {
    onUpdateField('forma_pagamento', forma);
  };

  const handleParcelasChange = (num: number) => {
    onUpdateField('parcelas_cartao', num);
  };

  // Estado local para o campo de cupom de desconto
  const [cupomInput, setCupomInput] = useState<string>(() => {
    return state.cupom_desconto || (state.houve_barganha ? 'ALBANOS' : '');
  });
  const [cupomErro, setCupomErro] = useState<string | null>(null);

  // Mantém o input em sincronia se o estado do cupom mudar externamente
  useEffect(() => {
    if (state.houve_barganha && state.cupom_desconto) {
      setCupomInput(state.cupom_desconto);
    } else if (!state.houve_barganha && !state.cupom_desconto) {
      // Se não houver cupom ativo, não sobrescreve a digitação atual a menos que queira resetar
    }
  }, [state.houve_barganha, state.cupom_desconto]);

  const handleAplicarCupom = () => {
    setCupomErro(null);
    const codigoLimpo = cupomInput.trim().toUpperCase();

    if (!codigoLimpo) {
      setCupomErro('Digite o código do cupom antes de aplicar.');
      return;
    }

    if (codigoLimpo === 'ALBANOS') {
      onUpdateField('houve_barganha', true);
      onUpdateField('cupom_desconto', 'ALBANOS');
      setCupomErro(null);
    } else {
      setCupomErro(`Cupom "${codigoLimpo}" inválido. Verifique o código e tente novamente.`);
      if (state.houve_barganha) {
        onUpdateField('houve_barganha', false);
        onUpdateField('cupom_desconto', '');
      }
    }
  };

  const handleRemoverCupom = () => {
    onUpdateField('houve_barganha', false);
    onUpdateField('cupom_desconto', '');
    setCupomInput('');
    setCupomErro(null);
  };

  const itens = orcamento?.itens || [];
  const totalProdutos = orcamento?.totalProdutosBruto || 0;
  const descontoValor = orcamento?.descontoBarganhaValor || 0;
  const freteValor = orcamento?.frete?.valor ?? state.frete?.valor ?? null;
  const freteStatus = orcamento?.frete?.status || state.frete?.status;
  const totalGeral = orcamento?.totalGeral ?? null;

  return (
    <div id="step-orcamento" className="max-w-xl mx-auto space-y-5 sm:space-y-6 py-3 sm:py-4 px-3 sm:px-4 w-full min-w-0">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 7 de 8 • Orçamento & Pagamento
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Orçamento & Pagamento
        </h2>
        <p className="text-xs text-stone-400">
          Confira o orçamento detalhado e escolha a forma de pagamento.
        </p>
      </div>

      {/* Tabela de Detalhamento por Estilo */}
      <div className="bg-stone-950/70 p-3.5 sm:p-4 rounded-xl border border-stone-800 space-y-3 w-full min-w-0">
        {/* Cabeçalho da Proposta Oficial com Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="https://i.postimg.cc/NFnKrBLb/logo-albanos-SO-LOGO-SEM-FUNDO-3.png"
              alt="Cervejaria Albanos"
              className="h-7 w-auto object-contain shrink-0 filter drop-shadow-[0_2px_6px_rgba(193,160,27,0.3)]"
            />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-['Raleway',sans-serif] truncate">
                Cervejaria Albanos • Proposta Oficial
              </div>
              <div className="text-[10px] text-stone-400 truncate">
                Chopp artesanal direto da fábrica
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs font-semibold text-stone-300">
          <span>Estilo & Quantidade</span>
          <span>Subtotal</span>
        </div>

        <div className="space-y-2.5">
          {itens.map((item) => (
            <div key={item.estilo} className="flex items-start sm:items-baseline justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1 leading-snug">
                <span className="font-semibold text-white block sm:inline">{item.nome}</span>
                <span className="text-stone-400 sm:ml-1.5 font-mono text-[11px] block sm:inline">
                  ({item.barris} {item.barris === 1 ? 'barril' : 'barris'} de 50 L × {formatarMoeda(item.precoUnitario)})
                </span>
              </div>
              <span className="font-mono font-semibold text-stone-200 shrink-0 text-right whitespace-nowrap pt-0.5 sm:pt-0">
                {formatarMoeda(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Subtotal dos Produtos */}
        <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2 text-xs">
          <span className="text-stone-400 min-w-0 flex-1">
            Subtotal dos Chopes ({state.barris_total_escolhidos || 0} barris):
          </span>
          <span className="font-mono font-bold text-stone-200 shrink-0 text-right whitespace-nowrap">
            {formatarMoeda(totalProdutos)}
          </span>
        </div>

        {/* Linha do Frete Discriminado */}
        <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-stone-800/60">
          <span className="text-stone-400 min-w-0 flex-1">
            Frete ({state.modalidade_logistica === 'RETIRADA_FABRICA' ? 'Retirada na Fábrica' : state.frete.faixaNome}):
          </span>
          <span className="font-mono font-bold text-amber-300 shrink-0 text-right whitespace-nowrap">
            {freteStatus === 'FIXADO' && freteValor !== null
              ? formatarMoeda(freteValor)
              : freteStatus === 'GRATIS'
              ? 'Grátis (R$ 0,00)'
              : 'A confirmar'}
          </span>
        </div>
      </div>

      {/* Escolha de Forma de Pagamento */}
      <div className="bg-stone-950/70 p-3.5 sm:p-4 rounded-xl border border-stone-800 space-y-3 w-full min-w-0">
        <label className="text-xs font-semibold text-stone-200 uppercase tracking-wider block">
          Forma de Pagamento
        </label>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleFormaPagamento('PIX')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition min-w-0 ${
              formaPagamentoAtiva === 'PIX'
                ? 'bg-amber-950/50 border-amber-500 text-white shadow-md'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <QrCode className="w-4 h-4 mx-auto mb-1 text-emerald-400 shrink-0" />
            <div className="text-xs font-bold truncate">PIX</div>
            <div className="text-[10px] text-stone-400 truncate">À vista</div>
          </button>

          <button
            type="button"
            onClick={() => handleFormaPagamento('DINHEIRO')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition min-w-0 ${
              formaPagamentoAtiva === 'DINHEIRO'
                ? 'bg-amber-950/50 border-amber-500 text-white shadow-md'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Banknote className="w-4 h-4 mx-auto mb-1 text-amber-400 shrink-0" />
            <div className="text-xs font-bold truncate">Dinheiro</div>
            <div className="text-[10px] text-stone-400 truncate">À vista</div>
          </button>

          <button
            type="button"
            onClick={() => handleFormaPagamento('CARTAO')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition min-w-0 ${
              formaPagamentoAtiva === 'CARTAO'
                ? 'bg-amber-950/50 border-amber-500 text-white shadow-md'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-400 shrink-0" />
            <div className="text-xs font-bold truncate">Cartão</div>
            <div className="text-[10px] text-stone-400 truncate">Até 12x</div>
          </button>
        </div>

        {/* Parcelamento Cartão */}
        {formaPagamentoAtiva === 'CARTAO' && (
          <div className="p-3 bg-stone-900/90 rounded-lg border border-stone-800 space-y-2 mt-2 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <span className="text-stone-300 font-medium">Número de parcelas:</span>
              <select
                value={state.parcelas_cartao || 1}
                onChange={(e) => handleParcelasChange(parseInt(e.target.value, 10))}
                className="bg-stone-950 border border-stone-700 rounded-md px-2.5 py-1.5 text-xs text-white outline-none w-full sm:w-auto"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                  <option key={p} value={p}>
                    {p}x {p === 1 ? '(sem acréscimo)' : `(1,5% a.m.)`}
                  </option>
                ))}
              </select>
            </div>

            {state.parcelas_cartao > 1 && totalGeral !== null && (
              <div className="text-[11px] text-stone-400 break-words">
                Acréscimo de parcelamento aplicado somente sobre os produtos:{' '}
                <strong className="text-amber-400">
                  {state.parcelas_cartao}x de {formatarMoeda(totalGeral / state.parcelas_cartao)}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Campo de Cupom de Desconto Albanos */}
        <div className="p-3 sm:p-3.5 bg-stone-900/90 border border-stone-800 rounded-xl space-y-2.5 w-full min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200">
            <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Cupom de Desconto</span>
          </div>

          {state.houve_barganha ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-lg space-y-1.5 w-full min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-xs font-bold text-emerald-300 flex items-center flex-wrap gap-1 min-w-0">
                    <span>Cupom</span>
                    <span className="font-mono tracking-wider text-white bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-500/40 text-[11px]">
                      ALBANOS
                    </span>
                    <span className="text-emerald-400 font-semibold text-[11px]">(-5%)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoverCupom}
                  className="shrink-0 text-[11px] text-stone-300 hover:text-rose-300 active:scale-95 flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-950 hover:bg-stone-900 border border-stone-700 transition"
                  title="Remover cupom de desconto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug break-words pl-6">
                {formaPagamentoAtiva === 'CARTAO'
                  ? 'Desconto pausado no cartão. Selecione PIX ou Dinheiro para ativar.'
                  : 'Desconto de 5% ativado com sucesso sobre os chopes à vista.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={cupomInput}
                    onChange={(e) => {
                      setCupomInput(e.target.value);
                      if (cupomErro) setCupomErro(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAplicarCupom();
                      }
                    }}
                    placeholder="Código do cupom"
                    className="w-full uppercase font-mono tracking-wider bg-stone-950 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAplicarCupom}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5 shrink-0"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Aplicar</span>
                </button>
              </div>

              {cupomErro && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="break-words">{cupomErro}</span>
                </div>
              )}

              {formaPagamentoAtiva === 'CARTAO' && (
                <p className="text-[11px] text-stone-400 leading-snug break-words">
                  * O cupom concede desconto exclusivo para pagamento à vista via PIX ou Dinheiro.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card do Total Geral Final */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/40 shadow-xl space-y-3 w-full min-w-0">
        {descontoValor > 0 && (
          <div className="flex items-center justify-between gap-2 text-xs text-emerald-400 pb-2 border-b border-stone-800/80">
            <span className="min-w-0 flex-1">Desconto cupom ALBANOS (5% à vista):</span>
            <span className="font-mono font-bold shrink-0 text-right whitespace-nowrap">
              -{formatarMoeda(descontoValor)}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
          <div className="min-w-0">
            <span className="text-base sm:text-lg uppercase tracking-wide font-bold text-amber-400 block">
              Total Geral
            </span>
            <span className="text-xs sm:text-sm text-stone-400 break-words block mt-0.5">
              {state.barris_total_escolhidos || 0} barris • {(state.barris_total_escolhidos || 0) * 50} L • {formaPagamentoAtiva}
              {formaPagamentoAtiva === 'CARTAO' && state.parcelas_cartao > 1 ? ` (${state.parcelas_cartao}x)` : ''}
            </span>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white whitespace-nowrap">
              {totalGeral !== null
                ? formatarMoeda(totalGeral)
                : freteValor !== null
                ? formatarMoeda(totalProdutos - descontoValor + freteValor)
                : `${formatarMoeda(totalProdutos - descontoValor)} + frete`}
            </span>
            {freteStatus === 'A_CONFIRMAR' && (
              <span className="text-[10px] text-amber-400 block whitespace-nowrap">
                + frete a confirmar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ações da Etapa */}
      <div className="pt-2 flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="px-4 sm:px-5 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-medium transition shrink-0"
        >
          Voltar
        </button>

        <button
          type="button"
          id="btn-aceitar-orcamento"
          onClick={onAcceptBudget}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-950 text-center"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Confirmar pedido</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
};
