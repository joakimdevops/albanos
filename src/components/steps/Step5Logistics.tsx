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
  Info,
} from 'lucide-react';
import { CalculatorState, ModalidadeLogistica } from '../../types';
import {
  obterDataHojeIso,
  calcularDataDMenos1,
  calcularSugestaoDataLogistica,
  obterHorarioSugeridoLogistica,
  validarDataLogistica,
  validarHorarioLogistica,
  obterLimitesHorarioLogistica,
  formatarDataBrasileira,
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
  const dataMaximaPermitida = state.data_evento || undefined;
  const dataSugerida = calcularSugestaoDataLogistica(state.data_evento, hojeIso);
  const horarioSugerido = obterHorarioSugeridoLogistica(state.horario_inicio_evento);

  // Inicializa data e horário sugeridos na modalidade ativa se ainda indefinidos
  useEffect(() => {
    if (state.modalidade_logistica === 'RETIRADA_FABRICA') {
      if (state.data_retirada === undefined && dataSugerida) {
        onUpdateField('data_retirada', dataSugerida);
      }
      if (state.hora_retirada === undefined && horarioSugerido) {
        onUpdateField('hora_retirada', horarioSugerido);
      }
    } else if (state.modalidade_logistica === 'ENTREGA') {
      if (state.data_entrega === undefined && dataSugerida) {
        onUpdateField('data_entrega', dataSugerida);
      }
      if (state.hora_entrega === undefined && horarioSugerido) {
        onUpdateField('hora_entrega', horarioSugerido);
      }
    }
  }, [
    state.modalidade_logistica,
    state.data_retirada,
    state.hora_retirada,
    state.data_entrega,
    state.hora_entrega,
    dataSugerida,
    horarioSugerido,
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

    if (!state.modalidade_logistica || state.modalidade_logistica === 'A_DEFINIR') {
      dispararErro(
        'Por favor, selecione se deseja Entrega no Local ou Retirada na Fábrica.',
        'modalidade_logistica'
      );
      return;
    }

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

      const valDataEntrega = validarDataLogistica(
        state.data_entrega,
        state.data_evento,
        hojeIso,
        'entrega'
      );
      if (!valDataEntrega.valido) {
        dispararErro(
          valDataEntrega.motivo || 'Data de entrega inválida.',
          'data_entrega',
          'input-data-entrega'
        );
        return;
      }

      const valHoraEntrega = validarHorarioLogistica(
        state.hora_entrega,
        state.data_entrega,
        state.data_evento,
        state.horario_inicio_evento,
        'entrega'
      );
      if (!valHoraEntrega.valido) {
        dispararErro(
          valHoraEntrega.motivo || 'Horário de entrega inválido.',
          'hora_entrega',
          'input-hora-entrega'
        );
        return;
      }
    } else if (state.modalidade_logistica === 'RETIRADA_FABRICA') {
      const validacaoData = validarDataLogistica(
        state.data_retirada,
        state.data_evento,
        hojeIso,
        'retirada'
      );
      if (!validacaoData.valido) {
        dispararErro(
          validacaoData.motivo || 'Data de retirada na fábrica inválida.',
          'data_retirada',
          'input-data-retirada'
        );
        return;
      }

      const validacaoHora = validarHorarioLogistica(
        state.hora_retirada,
        state.data_retirada,
        state.data_evento,
        state.horario_inicio_evento,
        'retirada'
      );
      if (!validacaoHora.valido) {
        dispararErro(
          validacaoHora.motivo || 'Horário de retirada na fábrica inválido.',
          'hora_retirada',
          'input-hora-retirada'
        );
        return;
      }
    }

    onNext();
  };

  const handleSelecionarEntrega = () => {
    if (campoComErro === 'modalidade_logistica') {
      setCampoComErro(null);
      setErro(null);
    }
    onUpdateField('modalidade_logistica', 'ENTREGA');
    if (state.data_entrega === undefined && dataSugerida) {
      onUpdateField('data_entrega', dataSugerida);
    }
    if (state.hora_entrega === undefined && horarioSugerido) {
      onUpdateField('hora_entrega', horarioSugerido);
    }
  };

  const handleSelecionarRetiradaFabrica = () => {
    if (campoComErro === 'modalidade_logistica') {
      setCampoComErro(null);
      setErro(null);
    }
    onUpdateField('modalidade_logistica', 'RETIRADA_FABRICA');
    if (state.data_retirada === undefined && dataSugerida) {
      onUpdateField('data_retirada', dataSugerida);
    }
    if (state.hora_retirada === undefined && horarioSugerido) {
      onUpdateField('hora_retirada', horarioSugerido);
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

  // Limites e status para entrega e retirada
  const limitesEntrega = obterLimitesHorarioLogistica(
    state.data_entrega,
    state.data_evento,
    state.horario_inicio_evento
  );

  const limitesRetirada = obterLimitesHorarioLogistica(
    state.data_retirada,
    state.data_evento,
    state.horario_inicio_evento
  );

  const horariosSugeridosBotoes = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

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
          Deseja entrega no local do evento ou prefere retirar diretamente na fábrica?
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
          onClick={handleSelecionarEntrega}
          className={`p-4 rounded-xl border text-left transition ${
            state.modalidade_logistica === 'ENTREGA'
              ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-white'
              : campoComErro === 'modalidade_logistica'
              ? 'bg-stone-950/70 border-rose-500/60 hover:border-rose-400 text-stone-300'
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
              ? 'bg-gradient-to-br from-[#0c443c]/50 via-stone-900 to-[#082d28]/40 border-[#0c443c] ring-1 ring-emerald-500/50 text-white shadow-lg shadow-[#0c443c]/20'
              : campoComErro === 'modalidade_logistica'
              ? 'bg-stone-950/70 border-rose-500/60 hover:border-rose-400 text-stone-300'
              : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold">Retirada na Fábrica</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0c443c] text-emerald-300 border border-[#155e53]">
              Frete Grátis
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            Retire pessoalmente na fábrica em Nova Lima.
          </p>
        </button>
      </div>

      {/* Orientações quando ainda não escolheu modalidade */}
      {(!state.modalidade_logistica || state.modalidade_logistica === 'A_DEFINIR') && (
        <div className="p-4 rounded-xl bg-stone-950/40 border border-dashed border-stone-800 text-center text-xs text-stone-400">
          Selecione uma das opções acima para preencher os dados de entrega ou agendar a retirada na fábrica.
        </div>
      )}

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

          {/* Data e Horário Desejados de Entrega */}
          <div className="border-t border-stone-800/80 pt-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Agendamento da Entrega</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-data-entrega" className="text-[11px] text-stone-400 block mb-1">
                  Data preferida para entrega <span className="text-rose-400">*</span>
                </label>
                <input
                  id="input-data-entrega"
                  type="date"
                  min={dataMinimaPermitida}
                  max={dataMaximaPermitida}
                  value={state.data_entrega || ''}
                  onChange={(e) => {
                    if (campoComErro === 'data_entrega') {
                      setCampoComErro(null);
                      setErro(null);
                    }
                    onUpdateField('data_entrega', e.target.value);
                  }}
                  className={`w-full bg-stone-900 border rounded-lg px-3 py-2 text-xs text-white outline-none transition [color-scheme:dark] ${
                    campoComErro === 'data_entrega'
                      ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                      : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Sugestão inicial: véspera do evento (D-1) ou dia do evento.
                </span>
              </div>

              <div>
                <label htmlFor="input-hora-entrega" className="text-[11px] text-stone-400 block mb-1">
                  Horário preferido de entrega <span className="text-rose-400">*</span>
                </label>
                <input
                  id="input-hora-entrega"
                  type="time"
                  min={limitesEntrega.min}
                  max={limitesEntrega.max}
                  value={state.hora_entrega || ''}
                  onChange={(e) => {
                    if (campoComErro === 'hora_entrega') {
                      setCampoComErro(null);
                      setErro(null);
                    }
                    onUpdateField('hora_entrega', e.target.value);
                  }}
                  className={`w-full bg-stone-900 border rounded-lg px-3 py-2 text-xs text-white outline-none transition [color-scheme:dark] ${
                    campoComErro === 'hora_entrega'
                      ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                      : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Janela comercial: 10:00 às 17:00.
                </span>
              </div>
            </div>

            {/* Avisos operacionais de horário para entrega */}
            {limitesEntrega.indisponivelMesmoDia ? (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/70 text-[11px] text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{limitesEntrega.motivoIndisponivel}</span>
              </div>
            ) : state.data_entrega === state.data_evento && state.horario_inicio_evento ? (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/50 text-[11px] text-amber-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  No dia do evento, a entrega deve ocorrer até às{' '}
                  <strong className="font-mono text-amber-300">{state.horario_inicio_evento}</strong> (início do evento).
                </span>
              </div>
            ) : null}

            {/* Sugestões de horários rápidos */}
            {!limitesEntrega.indisponivelMesmoDia && (
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] text-stone-400">Sugestões (10h às 17h):</span>
                {horariosSugeridosBotoes
                  .filter((h) => h >= limitesEntrega.min && h <= limitesEntrega.max)
                  .map((hora) => {
                    const ativo = state.hora_entrega === hora;
                    return (
                      <button
                        key={hora}
                        type="button"
                        onClick={() => {
                          if (campoComErro === 'hora_entrega') {
                            setCampoComErro(null);
                            setErro(null);
                          }
                          onUpdateField('hora_entrega', hora);
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded border font-mono transition ${
                          ativo
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                        }`}
                      >
                        {hora}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulário Condicional de Retirada */}
      {state.modalidade_logistica === 'RETIRADA_FABRICA' && (
        <div className="bg-gradient-to-b from-[#0c443c]/20 via-stone-950/80 to-stone-950/90 p-4 rounded-xl border border-[#0c443c]/50 space-y-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Dados para Retirada na Cervejaria</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#0c443c] border border-[#155e53] text-[10px] font-semibold text-emerald-300">
              Sem Custo de Frete
            </span>
          </div>

          <div className="bg-gradient-to-r from-[#0c443c]/35 via-stone-900/90 to-stone-900/90 p-3 rounded-lg border border-[#155e53]/50 text-xs text-stone-300 space-y-1">
            <span className="text-amber-400 font-semibold block font-['Raleway',sans-serif]">Fábrica Cervejaria Albanos:</span>
            <div>R. Rainha Elizabeth, 639 – Jardim Canadá, Nova Lima – MG, CEP 34007-790</div>
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
                max={dataMaximaPermitida}
                value={state.data_retirada || ''}
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
              <span className="text-[10px] text-stone-500 mt-1 block">
                Sugestão inicial: véspera do evento (D-1) ou dia do evento.
              </span>
            </div>

            <div>
              <label htmlFor="input-hora-retirada" className="text-[11px] text-stone-400 block mb-1">
                Horário aproximado de retirada <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-hora-retirada"
                type="time"
                min={limitesRetirada.min}
                max={limitesRetirada.max}
                value={state.hora_retirada || ''}
                onChange={(e) => {
                  if (campoComErro === 'hora_retirada') {
                    setCampoComErro(null);
                    setErro(null);
                  }
                  onUpdateField('hora_retirada', e.target.value);
                }}
                className={`w-full bg-stone-900 border rounded-lg px-3 py-2 text-xs text-white outline-none transition [color-scheme:dark] ${
                  campoComErro === 'hora_retirada'
                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                    : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                Janela comercial: 10:00 às 17:00.
              </span>
            </div>
          </div>

          {/* Avisos operacionais de horário para retirada */}
          {limitesRetirada.indisponivelMesmoDia ? (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/70 text-[11px] text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{limitesRetirada.motivoIndisponivel}</span>
            </div>
          ) : state.data_retirada === state.data_evento && state.horario_inicio_evento ? (
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/50 text-[11px] text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                No dia do evento, a retirada deve ocorrer até às{' '}
                <strong className="font-mono text-amber-300">{state.horario_inicio_evento}</strong> (início do evento).
              </span>
            </div>
          ) : null}

          {/* Sugestões de horários rápidos */}
          {!limitesRetirada.indisponivelMesmoDia && (
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[10px] text-stone-400">Sugestões (10h às 17h):</span>
              {horariosSugeridosBotoes
                .filter((h) => h >= limitesRetirada.min && h <= limitesRetirada.max)
                .map((hora) => {
                  const ativo = state.hora_retirada === hora;
                  return (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => {
                        if (campoComErro === 'hora_retirada') {
                          setCampoComErro(null);
                          setErro(null);
                        }
                        onUpdateField('hora_retirada', hora);
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded border font-mono transition ${
                        ativo
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      {hora}
                    </button>
                  );
                })}
            </div>
          )}

          <p className="text-[11px] text-stone-400 leading-relaxed pt-1 border-t border-stone-800/60">
            <strong className="text-amber-400 font-semibold">OBS:</strong> Por padrão, nosso sistema sugere a retirada na véspera (D-1), mas você pode definir qualquer data e horário comercial entre hoje e o início do evento.
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
