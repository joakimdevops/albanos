/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T8: Revisão Pré-Orçamento V1.1
 */

import React from 'react';
import {
  CheckSquare,
  Edit2,
  Calendar,
  Beer,
  Zap,
  Truck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { CalculatorState } from '../../types';
import { formatarResumoMix } from '../../businessRules/mixEngine';
import { formatarMoeda } from '../../businessRules/budgetEngine';
import { formatarDataBrasileira } from '../../businessRules/logisticsEngine';

interface Step6ReviewProps {
  state: CalculatorState;
  onConfirmReview: () => void;
  onGoToStep: (etapa: number) => void;
  onBack: () => void;
}

export const Step6Review: React.FC<Step6ReviewProps> = ({
  state,
  onConfirmReview,
  onGoToStep,
  onBack,
}) => {
  const barris = state.barris_total_escolhidos || 0;
  const litros = barris * 50;

  return (
    <div id="step-revisao" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 6 de 8 • Conferência Pré-Cotação
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Revise as escolhas do seu evento
        </h2>
        <p className="text-xs text-stone-400">
          Confira os detalhes antes de prosseguirmos para a identificação e geração da sua cotação.
        </p>
      </div>

      {/* Seções Resumidas com Botão de Editar */}
      <div className="space-y-3">
        {/* 1. Evento */}
        <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-stone-200 block text-sm mb-0.5">
                Evento & Público
              </span>
              <div className="text-stone-300">
                Data: <strong>{state.data_evento ? formatarDataBrasileira(state.data_evento) : 'Não informada'}</strong>
                {state.horario_inicio_evento ? (
                  <>
                    {' às '}
                    <strong>{state.horario_inicio_evento}</strong>
                  </>
                ) : null}{' '}
                em <strong>{state.cidade}</strong>
              </div>
              <div className="text-stone-400 mt-0.5">
                {state.qtd_adultos} adultos •{' '}
                {state.evento_longo_ou_multiplos_dias
                  ? 'Evento com mais de 12h ou múltiplos dias (análise comercial)'
                  : `${state.duracao_horas}h de evento`}{' '}
                •{' '}
                {state.outras_bebidas_alcoolicas === 'SIM'
                  ? 'Com outras bebidas alcoólicas'
                  : 'Somente chope'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-900 transition shrink-0"
            title="Editar dados do evento (Etapa 1)"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Quantidade e Mix */}
        <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Beer className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-bold text-stone-200 text-sm">
                  {barris} barris ({litros} Litros)
                </span>
              </div>
              <div className="text-amber-300 font-medium mt-1">
                {formatarResumoMix(state.mix)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-900 transition shrink-0"
            title="Editar mix de estilos (Etapa 3)"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Equipamentos */}
        <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-stone-200 block text-sm mb-0.5">
                Equipamentos Solicitados
              </span>
              <div className="text-stone-300">
                Chopeira elétrica: <strong>{state.precisa_chopeira === true ? 'Solicitada (disponibilidade a confirmar)' : state.precisa_chopeira === false ? 'Não (equipamento próprio)' : 'Não informado'}</strong>
              </div>
              <div className="text-stone-400 mt-0.5">
                Cilindro de CO2: <strong>{state.precisa_gas === true ? 'Solicitado (disponibilidade a confirmar)' : state.precisa_gas === false ? 'Não (gás próprio)' : 'Não informado'}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-900 transition shrink-0"
            title="Editar equipamentos (Etapa 4)"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* 4. Logística & Frete */}
        <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-stone-200 block text-sm mb-0.5">
                Logística & Frete
              </span>
              {state.modalidade_logistica === 'RETIRADA_FABRICA' ? (
                <div>
                  <div className="text-stone-300 font-semibold">Retirada na Fábrica (Jardim Canadá, Nova Lima)</div>
                  <div className="text-stone-400 text-[11px] mt-0.5">R. Rainha Elizabeth, 639 – Jardim Canadá, Nova Lima – MG, CEP 34007-790</div>
                  {state.data_retirada && (
                    <div className="text-stone-300 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-stone-400">Agendada para:</span>
                      <strong className="text-amber-400 font-mono">
                        {formatarDataBrasileira(state.data_retirada)}
                        {state.hora_retirada ? ` às ${state.hora_retirada}` : ''}
                      </strong>
                    </div>
                  )}
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0c443c] border border-[#155e53] text-[10px] text-emerald-300 font-semibold">
                      Frete Grátis (R$ 0,00)
                    </span>
                  </div>
                </div>
              ) : state.modalidade_logistica === 'ENTREGA' ? (
                <div>
                  <div className="text-stone-300">
                    Entrega em: {state.endereco.logradouro}, {state.endereco.numero} - {state.endereco.bairro} ({state.cidade})
                  </div>
                  {state.data_entrega && (
                    <div className="text-stone-300 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-stone-400">Previsão de entrega:</span>
                      <strong className="text-amber-400 font-mono">
                        {formatarDataBrasileira(state.data_entrega)}
                        {state.hora_entrega ? ` às ${state.hora_entrega}` : ''}
                      </strong>
                    </div>
                  )}
                  <div className="text-amber-300 font-semibold mt-0.5">
                    Frete: {state.frete.status === 'FIXADO' && state.frete.valor !== null ? formatarMoeda(state.frete.valor) : 'A confirmar com a equipe'}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-amber-400 font-medium">
                    Modalidade não definida
                  </div>
                  <div className="text-stone-400 text-[11px] mt-0.5">
                    Selecione entrega no local ou retirada na fábrica na Etapa 5.
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(5)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-900 transition shrink-0"
            title="Editar endereço e logística (Etapa 5)"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aviso de Confirmação */}
      <div className="p-3 bg-gradient-to-r from-[#0c443c]/35 via-stone-950 to-stone-950 border border-[#0c443c]/50 rounded-xl text-[11px] text-stone-300 flex items-center gap-2 shadow-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Confira com atenção se está tudo certo antes de avançar para a identificação!</span>
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
          id="btn-gerar-orcamento"
          onClick={onConfirmReview}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-950 cursor-pointer"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Avançar para Identificação</span>
        </button>
      </div>
    </div>
  );
};
