/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T2: Dados do Evento V1.1
 */

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Wine, ArrowRight, AlertCircle } from 'lucide-react';
import { CalculatorState, OutrasBebidas } from '../../types';
import { MUNICIPIOS_COLAR_METROPOLITANO, MUNICIPIOS_RMBH } from '../../businessRules/domainConfig';
import { obterDataHojeIso } from '../../businessRules/logisticsEngine';
import {
  validarDataEvento,
  validarHorarioInicio,
  validarQtdAdultos,
  validarQtdPessoas,
  validarDuracaoHoras,
} from '../../businessRules/validators';

interface Step1EventProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step1Event: React.FC<Step1EventProps> = ({
  state,
  onUpdateField,
  onNext,
  onBack,
}) => {
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  const hojeStr = obterDataHojeIso();

  const dispararErro = (mensagem: string, idCampo: string, idElementoFoco?: string) => {
    setErro(mensagem);
    setCampoComErro(idCampo);

    // Scroll imediato e prioritário para o topo absoluto da página (onde o banner de erro é renderizado)
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    // Reforço via scrollIntoView no banner com offset da navbar fixa
    setTimeout(() => {
      const banner = document.getElementById('disclaimer-erro-step1') || document.getElementById('step-evento');
      if (banner) {
        banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (idElementoFoco) {
        const el = document.getElementById(idElementoFoco);
        if (el) {
          // Foca o campo sem permitir que o foco roube o scroll para baixo
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

    if (!state.data_evento) {
      dispararErro('Por favor, selecione a data do evento.', 'data_evento', 'input-data-evento');
      return;
    }
    if (!validarDataEvento(state.data_evento, hojeStr)) {
      dispararErro('A data do evento é inválida ou não pode estar no passado.', 'data_evento', 'input-data-evento');
      return;
    }
    if (!state.horario_inicio_evento || !state.horario_inicio_evento.trim()) {
      dispararErro('Por favor, informe o horário de início do evento.', 'horario_inicio_evento', 'input-horario-inicio');
      return;
    }
    if (!validarHorarioInicio(state.horario_inicio_evento)) {
      dispararErro('Por favor, informe um horário válido de início do evento (formato HH:mm).', 'horario_inicio_evento', 'input-horario-inicio');
      return;
    }
    if (!state.cidade || !state.cidade.trim()) {
      if (selecionouOutra) {
        dispararErro('Por favor, digite o nome da sua cidade.', 'cidade', 'input-cidade-customizada');
      } else {
        dispararErro('Por favor, selecione a cidade do evento.', 'cidade', 'select-cidade');
      }
      return;
    }
    if (!validarQtdAdultos(state.qtd_adultos)) {
      dispararErro('Informe pelo menos 1 adulto consumidor (número inteiro).', 'qtd_adultos', 'input-qtd-adultos');
      return;
    }
    if (!validarQtdPessoas(state.qtd_pessoas, state.qtd_adultos)) {
      dispararErro('A quantidade total de pessoas deve ser um número inteiro maior ou igual ao de adultos.', 'qtd_adultos', 'input-qtd-adultos');
      return;
    }
    if (!state.evento_longo_ou_multiplos_dias) {
      if (!validarDuracaoHoras(state.duracao_horas)) {
        dispararErro(
          'Por favor, confirme a duração do seu evento (de 1 a 12 horas inteiras).',
          'duracao_horas',
          'input-duracao'
        );
        return;
      }
    }
    if (!state.outras_bebidas_alcoolicas) {
      dispararErro('Informe se haverá outras bebidas alcoólicas no evento.', 'outras_bebidas_alcoolicas', 'btn-outras-nao');
      return;
    }

    onNext();
  };

  const handleAtualizarCampo = (campo: keyof CalculatorState | string, valor: any) => {
    if (campoComErro === campo) {
      setCampoComErro(null);
      setErro(null);
    }
    onUpdateField(campo, valor);
  };

  const CIDADES_PRINCIPAIS_BH_RMBH = [
    'Belo Horizonte',
    'Nova Lima',
    'Contagem',
    'Betim',
    'Sabará',
    'Lagoa Santa',
    'Santa Luzia',
    'Brumadinho',
    'Ribeirão das Neves',
    'Pedro Leopoldo',
    'Ibirité',
    'Vespasiano',
  ];

  const ehCidadePredefinida = Boolean(state.cidade && CIDADES_PRINCIPAIS_BH_RMBH.includes(state.cidade));

  const [selecionouOutra, setSelecionouOutra] = useState<boolean>(() => {
    return Boolean(state.cidade && !CIDADES_PRINCIPAIS_BH_RMBH.includes(state.cidade));
  });

  const valorSelect = selecionouOutra
    ? 'OUTRA'
    : ehCidadePredefinida
    ? state.cidade
    : '';

  const handleSelectCidade = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OUTRA') {
      setSelecionouOutra(true);
      if (ehCidadePredefinida) {
        handleAtualizarCampo('cidade', '');
      }
    } else {
      setSelecionouOutra(false);
      handleAtualizarCampo('cidade', val);
    }
  };

  return (
    <div id="step-evento" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Cabeçalho da Etapa */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 1 de 8 • Dados do Evento
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Me conta os detalhes do evento?
        </h2>
        <p className="text-xs text-stone-400">
          Essas informações ajudam a calcular a quantidade ideal de chope.
        </p>
      </div>

      {erro && (
        <div
          id="disclaimer-erro-step1"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="scroll-mt-20 p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-100 text-xs sm:text-sm font-medium flex items-center gap-3 shadow-xl shadow-rose-950/70 animate-pulse outline-none"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="flex-1 font-semibold">{erro}</span>
        </div>
      )}

      {/* Formulário de Cards Compactos */}
      <div className="space-y-4">
        {/* Data do Evento */}
        <div
          className={`bg-stone-950/70 p-4 rounded-xl border space-y-2 transition-colors ${
            campoComErro === 'data_evento'
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
              : 'border-stone-800'
          }`}
        >
          <label htmlFor="input-data-evento" className="flex items-center gap-2 text-xs font-semibold text-stone-200">
            <Calendar className="w-4 h-4 text-amber-400" />
            Data do Evento <span className="text-rose-400">*</span>
          </label>
          <input
            id="input-data-evento"
            type="date"
            min={hojeStr}
            value={state.data_evento || ''}
            onChange={(e) => handleAtualizarCampo('data_evento', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition [color-scheme:dark]"
          />
          {state.dias_ate_evento !== undefined && state.dias_ate_evento >= 0 && (
            <p className="text-[11px] text-stone-400">
              {state.dias_ate_evento === 0
                ? '⚡ O evento é hoje!'
                : state.dias_ate_evento <= 3
                ? `⚠️ Faltam ${state.dias_ate_evento} dias (atendimento prioritário).`
                : `Faltam ${state.dias_ate_evento} dias para o evento.`}
            </p>
          )}
        </div>

        {/* Horário de Início do Evento */}
        <div
          className={`bg-stone-950/70 p-4 rounded-xl border space-y-2 transition-colors ${
            campoComErro === 'horario_inicio_evento'
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
              : 'border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="input-horario-inicio" className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Clock className="w-4 h-4 text-amber-400" />
              Horário de Início do Evento <span className="text-rose-400">*</span>
            </label>
            {state.horario_inicio_evento && (
              <span className="text-[11px] text-amber-400 font-mono font-medium">
                {state.horario_inicio_evento}
              </span>
            )}
          </div>
          <input
            id="input-horario-inicio"
            type="time"
            required
            value={state.horario_inicio_evento || ''}
            onChange={(e) => handleAtualizarCampo('horario_inicio_evento', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition [color-scheme:dark]"
          />
          {/* Sugestões rápidas de horários mais frequentes */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span className="text-[10px] text-stone-400">Sugestões:</span>
            {['11:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00'].map((hora) => {
              const ativo = state.horario_inicio_evento === hora;
              return (
                <button
                  key={hora}
                  type="button"
                  onClick={() => handleAtualizarCampo('horario_inicio_evento', hora)}
                  className={`text-[11px] px-2 py-0.5 rounded border font-mono transition ${
                    ativo
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 font-semibold'
                      : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  {hora}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cidade do Evento - Menu Suspenso com Cidades Principais e Opção "OUTRA" */}
        <div
          className={`bg-stone-950/70 p-4 rounded-xl border space-y-2.5 transition-colors ${
            campoComErro === 'cidade'
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
              : 'border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="select-cidade" className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <MapPin className="w-4 h-4 text-amber-400" />
              Cidade <span className="text-rose-400">*</span>
            </label>
          </div>

          <div className="relative">
            <select
              id="select-cidade"
              value={valorSelect}
              onChange={handleSelectCidade}
              className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition cursor-pointer appearance-none"
            >
              <option value="">Selecione a cidade do evento</option>
              {CIDADES_PRINCIPAIS_BH_RMBH.map((cid) => (
                <option key={cid} value={cid}>
                  {cid}
                </option>
              ))}
              <option value="OUTRA">Outra cidade (digitar manualmente)...</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Campo aberto caso "OUTRA" seja selecionada */}
          {selecionouOutra && (
            <div className="pt-1.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <label
                htmlFor="input-cidade-customizada"
                className="text-[11px] font-medium text-amber-300 flex items-center gap-1.5"
              >
                <span>Digite o nome da sua cidade:</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-cidade-customizada"
                type="text"
                autoFocus
                placeholder="Ex.: Ouro Preto, Mariana, Divinópolis, Pará de Minas..."
                value={selecionouOutra && !ehCidadePredefinida ? state.cidade || '' : ''}
                onChange={(e) => handleAtualizarCampo('cidade', e.target.value)}
                className="w-full bg-stone-900 border border-amber-600/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-stone-500 outline-none transition"
              />
              <p className="text-[11px] text-stone-400 leading-relaxed">
                💡 Para cidades fora da rota padrão da Grande BH, a viabilidade de entrega e o frete serão confirmados pelo Time Comercial Albanos via WhatsApp.
              </p>
            </div>
          )}
        </div>

        {/* Público: Total de Pessoas e Adultos */}
        <div
          className={`bg-stone-950/70 p-4 rounded-xl border space-y-3 transition-colors ${
            campoComErro === 'qtd_adultos'
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
              : 'border-stone-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
            <Users className="w-4 h-4 text-amber-400" />
            Público Estimado
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-qtd-pessoas" className="text-[11px] text-stone-400 block mb-1">
                Total de Convidados
              </label>
              <input
                id="input-qtd-pessoas"
                type="number"
                min="1"
                placeholder="Ex.: 100"
                value={state.qtd_pessoas || ''}
                onChange={(e) => handleAtualizarCampo('qtd_pessoas', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3.5 py-2 text-sm text-white outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="input-qtd-adultos" className="text-[11px] text-stone-400 block mb-1">
                Adultos Consumidores <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-qtd-adultos"
                type="number"
                min="1"
                placeholder="Ex.: 80"
                value={state.qtd_adultos || ''}
                onChange={(e) => handleAtualizarCampo('qtd_adultos', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3.5 py-2 text-sm text-white outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Duração do Evento */}
        <div
          className={`bg-stone-950/70 p-4 rounded-xl border space-y-3 transition-colors ${
            campoComErro === 'duracao_horas'
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
              : 'border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="input-duracao" className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Clock className="w-4 h-4 text-amber-400" />
              Duração do Evento <span className="text-rose-400">*</span>
            </label>
            <span className="text-sm font-bold font-mono text-amber-400">
              {state.evento_longo_ou_multiplos_dias
                ? 'Evento Especial (> 12h)'
                : state.duracao_horas
                ? `${state.duracao_horas} horas`
                : 'Selecione a duração'}
            </span>
          </div>

          {/* Seletor normal de 1 a 12 horas (desabilitado se evento especial estiver ativo) */}
          <div className={`space-y-3 transition-opacity ${state.evento_longo_ou_multiplos_dias ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <input
              id="input-duracao"
              type="range"
              min="1"
              max="12"
              step="1"
              disabled={Boolean(state.evento_longo_ou_multiplos_dias)}
              value={state.duracao_horas || 4}
              onChange={(e) => handleAtualizarCampo('duracao_horas', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 bg-stone-800 h-2 rounded-lg cursor-pointer"
            />

            {/* Botões rápidos de duração: 2h, 4h, 6h, 8h, 12h */}
            <div className="flex justify-between text-xs gap-1 pt-1">
              {[2, 4, 6, 8, 12].map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={Boolean(state.evento_longo_ou_multiplos_dias)}
                  onClick={() => handleAtualizarCampo('duracao_horas', h)}
                  className={`flex-1 py-1.5 rounded-md border text-center transition ${
                    !state.evento_longo_ou_multiplos_dias && state.duracao_horas === h
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Opção para Eventos com mais de 12h ou em múltiplos dias (mutuamente exclusivo) */}
          <div className="pt-2 border-t border-stone-800/80">
            <button
              type="button"
              id="btn-evento-longo"
              onClick={() => {
                const novoValor = !state.evento_longo_ou_multiplos_dias;
                handleAtualizarCampo('evento_longo_ou_multiplos_dias', novoValor);
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                state.evento_longo_ou_multiplos_dias
                  ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50 text-white'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(state.evento_longo_ou_multiplos_dias)}
                readOnly
                className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-amber-500 accent-amber-500 pointer-events-none"
              />
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-amber-300 block">
                  Evento com mais de 12 horas ou em múltiplos dias
                </span>
                <span className="text-[11px] text-stone-400 block leading-relaxed">
                  Para eventos de longa duração ou múltiplos dias, não extrapolamos fórmulas automáticas. Seus dados serão preservados e o dimensionamento será tratado diretamente com o Time Comercial Albanos.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Presença de Outras Bebidas Alcoólicas */}
        <div
          className={`bg-stone-950/70 p-4 rounded-xl border space-y-2.5 transition-colors ${
            campoComErro === 'outras_bebidas_alcoolicas'
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
              : 'border-stone-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
            <Wine className="w-4 h-4 text-amber-400" />
            Haverá outras bebidas alcoólicas? <span className="text-rose-400">*</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              id="btn-outras-nao"
              onClick={() => handleAtualizarCampo('outras_bebidas_alcoolicas', 'NAO')}
              className={`p-3 rounded-xl border text-center transition ${
                state.outras_bebidas_alcoolicas === 'NAO'
                  ? 'bg-amber-950/50 border-amber-500 text-white shadow-md'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="text-xs font-bold">Não (Somente chope)</div>
            </button>

            <button
              type="button"
              id="btn-outras-sim"
              onClick={() => handleAtualizarCampo('outras_bebidas_alcoolicas', 'SIM')}
              className={`p-3 rounded-xl border text-center transition ${
                state.outras_bebidas_alcoolicas === 'SIM'
                  ? 'bg-amber-950/50 border-amber-500 text-white shadow-md'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="text-xs font-bold">Sim (Com outras bebidas)</div>
            </button>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
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
          id="btn-avancar-dimensionamento"
          onClick={handleValidarAvanco}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-950"
        >
          <span>Calcular Dimensionamento</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
