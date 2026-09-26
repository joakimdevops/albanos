/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T7: Logística e Frete V1.1
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Store,
  MapPin,
  Clock,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { CalculatorState, ModalidadeLogistica } from '../../types';
import {
  obterDataHojeIso,
  calcularDataDMenos1,
  calcularDataMaisDias,
  obterHorarioPadraoRetirada,
  validarDataRetiradaFabrica,
} from '../../businessRules/logisticsEngine';

interface Step5LogisticsProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Logistics: React.FC<Step5LogisticsProps> = ({
  state,
  onUpdateField,
  onNext,
  onBack,
}) => {
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  const hojeIso = obterDataHojeIso();
  const dataMinimaPermitida = hojeIso;
  const dataDMenos1 = state.data_evento ? calcularDataDMenos1(state.data_evento) : '';
  const horarioPadrao = obterHorarioPadraoRetirada(state.horario_inicio_evento);

  // Inicializa data_retirada em D - 1 e hora_retirada com o horário do evento se ainda não preenchidos
  useEffect(() => {
    if (state.modalidade_logistica === 'RETIRADA_FABRICA') {
      if (!state.data_retirada && dataDMenos1) {
        onUpdateField('data_retirada', dataDMenos1);
      }
      if (!state.hora_retirada) {
        onUpdateField('hora_retirada', horarioPadrao);
      }
    }
  }, [
    state.modalidade_logistica,
    state.data_retirada,
    state.hora_retirada,
    dataDMenos1,
    horarioPadrao,
    onUpdateField,
  ]);

  const dispararErro = (mensagem: string, idCampo: string, idElementoFoco?: string) => {
    setErro(mensagem);
    setCampoComErro(idCampo);

    // Scroll imediato e prioritário para o topo absoluto da página
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    setTimeout(() => {
      const banner = document.getElementById('disclaimer-erro-step5') || document.getElementById('step-logistica');
      if (banner) {
        banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (idElementoFoco) {
        const el = document.getElementById(idElementoFoco);
        if (el) {
          try {
            el.focus({ preventScroll: true });
          } catch {
            el.focus();
          }
        }
      }
    }, 50);
  };

  const handleValidarAvanco = () => {
    setErro(null);
    setCampoComErro(null);

    if (state.modalidade_logistica === 'ENTREGA') {
      if (!state.cidade || !state.cidade.trim()) {
        dispararErro('Por favor, informe a cidade para a entrega.', 'cidade');
        return;
      }
      if (!state.endereco.logradouro || !state.endereco.logradouro.trim()) {
        dispararErro('Por favor, informe o logradouro (rua, avenida) para entrega.', 'logradouro', 'input-logradouro');
        return;
      }
      if (!state.endereco.numero || !state.endereco.numero.trim()) {
        dispararErro('Por favor, informe o número do endereço.', 'numero', 'input-numero');
        return;
      }
      if (!state.endereco.bairro || !state.endereco.bairro.trim()) {
        dispararErro('Por favor, informe o bairro.', 'bairro', 'input-bairro');
        return;
      }
    } else if (state.modalidade_logistica === 'RETIRADA_FABRICA') {
      const validacao = validarDataRetiradaFabrica(
        state.data_retirada,
        state.data_evento,
        hojeIso
      );
      if (!validacao.valido) {
        dispararErro(
          validacao.motivo || 'Data de retirada na fábrica inválida.',
          'data_retirada',
          'input-data-retirada'
        );
        return;
      }
    }

    onNext();
  };

  const handleSelecionarRetiradaFabrica = () => {
    onUpdateField('modalidade_logistica', 'RETIRADA_FABRICA');
    if (!state.data_retirada && dataDMenos1) {
      onUpdateField('data_retirada', dataDMenos1);
    }
    if (!state.hora_retirada) {
      onUpdateField('hora_retirada', horarioPadrao);
    }
  };

  const handleEnderecoChange = (subcampo: string, valor: string) => {
    if (campoComErro === subcampo) {
      setCampoComErro(null);
      setErro(null);
    }
    onUpdateField('endereco', {
      ...state.endereco,
      [subcampo]: valor,
    });
  };

  return (
    <div id="step-logistica" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 5 de 8 • Logística & Frete
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Como prefere receber seu chope?
        </h2>
        <p className="text-xs text-stone-400">
          Deseja que nossa equipe entregue no local ou prefere retirar diretamente na fábrica?
        </p>
      </div>

      {erro && (
        <div
          id="disclaimer-erro-step5"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="scroll-mt-20 p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-100 text-xs sm:text-sm font-medium flex items-center gap-3 shadow-xl shadow-rose-950/70 animate-pulse outline-none"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="flex-1 font-semibold">{erro}</span>
        </div>
      )}

      {/* Seletor de Modalidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onUpdateField('modalidade_logistica', 'ENTREGA')}
          className={`p-4 rounded-xl border text-left transition ${
            state.modalidade_logistica === 'ENTREGA'
              ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-white'
              : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-300'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <Truck className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold">Entrega no Local</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Montagem e entrega no local do seu evento.
          </p>
        </button>

        <button
          type="button"
          onClick={handleSelecionarRetiradaFabrica}
          className={`p-4 rounded-xl border text-left transition ${
            state.modalidade_logistica === 'RETIRADA_FABRICA'
              ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-white'
              : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-300'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <Store className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold">Retirada na Fábrica</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Retire pessoalmente na fábrica em Nova Lima.
          </p>
        </button>
      </div>

      {/* Formulário Condicional de Entrega */}
      {state.modalidade_logistica === 'ENTREGA' && (
        <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <MapPin className="w-4 h-4 text-amber-400" />
              Endereço da Entrega
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="input-logradouro" className="text-[11px] text-stone-400 block mb-1">
                Logradouro (Rua, Avenida) <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-logradouro"
                type="text"
                placeholder="Ex.: Rua dos Inconfidentes"
                value={state.endereco.logradouro}
                onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
                className={`w-full bg-stone-900 border rounded-lg px-3 py-2 text-xs text-white outline-none transition ${
                  campoComErro === 'logradouro'
                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                    : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
            </div>

            <div>
              <label htmlFor="input-numero" className="text-[11px] text-stone-400 block mb-1">
                Número <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-numero"
                type="text"
                placeholder="Ex.: 1000"
                value={state.endereco.numero}
                onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                className={`w-full bg-stone-900 border rounded-lg px-3 py-2 text-xs text-white outline-none transition ${
                  campoComErro === 'numero'
                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                    : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-bairro" className="text-[11px] text-stone-400 block mb-1">
                Bairro <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-bairro"
                type="text"
                placeholder="Ex.: Savassi, Belvedere, Lourdes"
                value={state.endereco.bairro}
                onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                className={`w-full bg-stone-900 border rounded-lg px-3 py-2 text-xs text-white outline-none transition ${
                  campoComErro === 'bairro'
                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                    : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] text-stone-400 block mb-1">
                Complemento (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex.: Apto 201, Casa, Salão de festas"
                value={state.endereco.complemento}
                onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulário Condicional de Retirada */}
      {state.modalidade_logistica === 'RETIRADA_FABRICA' && (
        <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Dados para Retirada na Cervejaria</span>
            </div>
          </div>

          <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 text-xs text-stone-300 space-y-1">
            <span className="text-amber-400 font-semibold block">Fábrica Cervejaria Albanos:</span>
            <div>Rua Rainha Elizabeth, 639, Jardim Canadá. Nova Lima - MG.</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-data-retirada" className="text-[11px] text-stone-400 block mb-1">
                Data pretendida de retirada <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-data-retirada"
                type="date"
                min={dataMinimaPermitida}
                max={dataDMenos1 || undefined}
                value={state.data_retirada || dataDMenos1 || ''}
                onChange={(e) => {
                  if (campoComErro === 'data_retirada') {
                    setCampoComErro(null);
                    setErro(null);
                  }
                  onUpdateField('data_retirada', e.target.value);
                }}
                className={`w-full bg-stone-900 border rounded-lg px-3 py-2 text-xs text-white outline-none transition [color-scheme:dark] ${
                  campoComErro === 'data_retirada'
                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                    : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
            </div>

            <div>
              <label htmlFor="input-hora-retirada" className="text-[11px] text-stone-400 block mb-1">
                Horário aproximado de retirada
              </label>
              <input
                id="input-hora-retirada"
                type="time"
                value={state.hora_retirada || horarioPadrao}
                onChange={(e) => {
                  if (campoComErro === 'hora_retirada') {
                    setCampoComErro(null);
                    setErro(null);
                  }
                  onUpdateField('hora_retirada', e.target.value);
                }}
                className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition [color-scheme:dark]"
              />
            </div>
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed pt-1 border-t border-stone-800/60">
            <strong className="text-amber-400 font-semibold">OBS:</strong> Por padrão, nosso sistema sugere a retirada 24 horas antes do início do evento, mas você pode definir a data/hora que desejar.
          </p>
        </div>
      )}

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
          id="btn-avancar-revisao"
          onClick={handleValidarAvanco}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-950"
        >
          <span>Revisar Pedido</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
