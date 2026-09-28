/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Etapa 8: Orçamento, Pagamento & Fechamento Final V1.1
 */

import React, { useMemo, useEffect, useState } from 'react';
import {
  CreditCard,
  QrCode,
  Clock,
  CheckCircle2,
  ArrowRight,
  Tag,
  X,
  AlertCircle,
  MessageSquare,
  User,
  ShieldCheck,
} from 'lucide-react';
import { CalculatorState, FormaPagamento } from '../../types';
import { calcularOrcamento, formatarMoeda } from '../../businessRules/budgetEngine';
import { MULTIPLICADORES_CARTAO } from '../../businessRules/domainConfig';
import { gerarLinkWhatsApp } from '../../businessRules/whatsappAdapter';

interface Step8BudgetProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onGoToStep?: (etapa: number) => void;
  onBack: () => void;
}

export const Step8Budget: React.FC<Step8BudgetProps> = ({
  state,
  onUpdateField,
  onGoToStep,
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
        formaPagamento: state.forma_pagamento,
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

  // Se o estado global ainda não tiver o objeto orçamento, sincroniza
  useEffect(() => {
    if (orcamento && (!state.orcamento || !state.orcamento.itens?.length)) {
      onUpdateField('orcamento', orcamento);
    }
  }, [orcamento, state.orcamento, onUpdateField]);

  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);

  const handleFormaPagamento = (forma: FormaPagamento) => {
    setErroPagamento(null);
    setPedidoConfirmado(false); // Exige confirmação expressa da nova condição financeira
    onUpdateField('forma_pagamento', forma);
    onUpdateField('parcelas_cartao', undefined); // Começa indefinido sem default automático
  };

  const handleParcelasChange = (num: number | undefined) => {
    setErroPagamento(null);
    setPedidoConfirmado(false);
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
  // Desconto de 5% aplicável exclusivamente se PIX for a forma de pagamento escolhida
  const descontoValor =
    state.forma_pagamento === 'PIX' && orcamento?.descontoAplicado
      ? orcamento.descontoBarganhaValor
      : 0;
  const freteValor = orcamento?.frete?.valor ?? state.frete?.valor ?? null;
  const freteStatus = orcamento?.frete?.status || state.frete?.status;
  const totalGeral = orcamento?.totalGeral ?? null;

  // Opções de parcelamento no cartão calculadas estritamente com os multiplicadores vigentes
  // Regra vigente: frete conhecido integra a base financeira para fins de cartão
  const opcoesParcelamento = useMemo(() => {
    const freteConhecido = freteValor !== null && freteStatus !== 'A_CONFIRMAR';
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => {
      const mult = MULTIPLICADORES_CARTAO[p] || 1.0;
      if (freteConhecido) {
        const baseCompleta = totalProdutos + (freteValor || 0);
        const totalCartao = Number((baseCompleta * mult).toFixed(2));
        const valorParcela = Number((totalCartao / p).toFixed(2));
        return {
          parcelas: p,
          multiplicador: mult,
          valorParcela,
          totalCartao,
        };
      } else {
        const prodAjustado = Number((totalProdutos * mult).toFixed(2));
        const valorParcela = Number((prodAjustado / p).toFixed(2));
        return {
          parcelas: p,
          multiplicador: mult,
          valorParcela,
          totalCartao: prodAjustado,
        };
      }
    });
  }, [totalProdutos, freteValor, freteStatus]);

  const numParcelasAtual = state.parcelas_cartao;
  const opcaoAtual = numParcelasAtual
    ? opcoesParcelamento.find((o) => o.parcelas === numParcelasAtual)
    : undefined;

  // Validação de gates para confirmação do pedido
  const temNome = Boolean(state.contato?.nome_completo?.trim());
  const temTelefone = Boolean(state.contato?.telefone_responsavel?.trim());
  const formaPagamentoDefinida = state.forma_pagamento !== 'A_DEFINIR';
  const parcelasValidas =
    state.forma_pagamento !== 'CARTAO' ||
    (typeof state.parcelas_cartao === 'number' &&
      state.parcelas_cartao >= 1 &&
      state.parcelas_cartao <= 12);
  const orcamentoValido = Boolean(orcamento && orcamento.invariantesValidos);

  const podeConfirmar =
    orcamentoValido && temNome && temTelefone && formaPagamentoDefinida && parcelasValidas;

  // Estado atualizado para geração do link
  const estadoAtualizadoParaHandoff = useMemo<CalculatorState>(() => {
    return {
      ...state,
      orcamento,
      aceite_orcamento: 'SIM',
    };
  }, [state, orcamento]);

  const linkWhatsApp = useMemo(() => {
    return gerarLinkWhatsApp(
      estadoAtualizadoParaHandoff,
      'final',
      undefined,
      8,
      'Cotação & Pagamento'
    );
  }, [estadoAtualizadoParaHandoff]);

  const handleConfirmarPedido = () => {
    if (!formaPagamentoDefinida) {
      setErroPagamento(
        'Por favor, selecione uma forma de pagamento (Pix ou Cartão) para confirmar sua cotação.'
      );
      return;
    }
    if (state.forma_pagamento === 'CARTAO' && !state.parcelas_cartao) {
      setErroPagamento(
        'Por favor, selecione a quantidade de parcelas no cartão de crédito.'
      );
      return;
    }
    if (!temNome || !temTelefone) {
      setErroPagamento('Identificação do responsável incompleta. Retorne à etapa anterior.');
      return;
    }

    // Registra o aceite formal do orçamento
    onUpdateField('aceite_orcamento', 'SIM');
    setPedidoConfirmado(true);

    // Abre o WhatsApp imediatamente
    try {
      if (typeof window !== 'undefined') {
        window.open(linkWhatsApp, '_blank');
      }
    } catch {
      // Ignora bloqueios de popup do navegador; link continua disponível no botão de confirmação
    }
  };

  return (
    <div id="step-orcamento" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Header da Etapa */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 8 de 8 • Cotação & Pagamento
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Cotação & Condições de Pagamento
        </h2>
        <p className="text-xs text-stone-400">
          Valores auditáveis calculados deterministamente com base nos seus dados e no portfólio Albanos.
        </p>
      </div>

      {/* Identificação do Lead (Capturado na Etapa 7) */}
      <div className="p-3.5 bg-stone-900/90 border border-stone-800 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold">
              Responsável pelo Pedido
            </span>
            <div className="text-stone-200 truncate">
              <strong className="text-white">{state.contato?.nome_completo || 'Não informado'}</strong>
              <span className="text-stone-400"> • {state.contato?.telefone_responsavel}</span>
              {state.contato?.email ? (
                <span className="text-stone-400 hidden sm:inline"> • {state.contato.email}</span>
              ) : null}
            </div>
          </div>
        </div>
        {onGoToStep && (
          <button
            type="button"
            onClick={() => onGoToStep(7)}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline shrink-0 cursor-pointer"
          >
            Editar
          </button>
        )}
      </div>

      {/* Confirmação de Sucesso após o clique em Confirmar */}
      {pedidoConfirmado && (
        <div className="p-5 bg-gradient-to-br from-emerald-950/70 via-stone-900 to-[#0c443c]/40 border border-emerald-500/60 rounded-2xl text-center space-y-3.5 shadow-2xl animate-fadeIn">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Raleway',sans-serif]">
              Cotação Confirmada pelo Cliente!
            </h3>
            <p className="text-xs text-emerald-200/90 mt-1 max-w-md mx-auto leading-relaxed">
              Sua solicitação foi encaminhada para continuidade comercial. O atendimento será conduzido pelo <strong>Time Comercial Albanos</strong> pelo WhatsApp para alinhamento de disponibilidade e próximos passos.
            </p>
          </div>
          <div className="pt-2">
            <a
              id="btn-reabrir-whatsapp-fechamento"
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Continuar atendimento no WhatsApp do Time Comercial</span>
            </a>
          </div>

          {/* Informações Operacionais e Horários de Atendimento */}
          <div className="p-3 bg-stone-900/90 rounded-xl border border-stone-800 text-left space-y-1 text-xs">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Canais e Horários de Atendimento</span>
            </div>
            <div className="text-[11px] text-stone-300 space-y-0.5 leading-relaxed">
              <p>• <strong>Iara:</strong> Atendimento automatizado 24 horas por dia.</p>
              <p>• <strong>Time Comercial Albanos:</strong> Segunda a sexta-feira, das 10h às 17h.</p>
              <p className="text-[10px] text-stone-400 pt-0.5">
                <em>Nota: Os horários da equipe comercial não interferem nas datas e janelas de entrega ou retirada agendadas para o seu evento.</em>
              </p>
            </div>
          </div>

          <p className="text-[11px] text-stone-400">
            Caso a janela do WhatsApp não tenha aberto automaticamente, basta clicar no botão acima para prosseguir. Tim-tim! 🍻
          </p>
        </div>
      )}

      {/* Itens do Chopp (Mix) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
          Chopp & Mix de Estilos
        </h3>
        <div className="space-y-2">
          {itens.map((item) => (
            <div
              key={item.estilo}
              className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-white block">{item.nome}</span>
                <span className="text-stone-400 text-[11px]">
                  {item.barris} {item.barris === 1 ? 'barril' : 'barris'} ({item.barris * 50} L) • {formatarMoeda(item.precoUnitario)}/un
                </span>
              </div>
              <div className="text-right font-mono font-bold text-amber-400 text-sm">
                {formatarMoeda(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipamentos Solicitados */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
          Equipamentos Solicitados
        </h3>
        <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-medium text-stone-200 block">
              {state.precisa_chopeira ? 'Chopeira Elétrica Albanos' : 'Chopeira Própria do Cliente'}
            </span>
            <span className="text-stone-400 text-[11px]">
              {state.precisa_chopeira
                ? 'Chopeira solicitada (disponibilidade a confirmar)'
                : 'Uso de equipamento próprio'}
              {state.precisa_gas !== undefined
                ? state.precisa_gas
                  ? ' • Gás CO2 solicitado (disponibilidade a confirmar)'
                  : ' • Gás próprio'
                : ''}
            </span>
          </div>
          <div className="text-right font-semibold text-amber-400 text-xs">
            {state.precisa_chopeira || state.precisa_gas ? 'A confirmar' : '—'}
          </div>
        </div>
      </div>

      {/* Logística & Frete */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
          Logística & Entrega
        </h3>
        <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-medium text-stone-200 block">
              {state.modalidade_logistica === 'RETIRADA_FABRICA'
                ? 'Retirada na Fábrica (Jardim Canadá, Nova Lima)'
                : `Entrega em ${state.cidade || 'Belo Horizonte'}`}
            </span>
            <span className="text-stone-400 text-[11px]">
              {state.modalidade_logistica === 'RETIRADA_FABRICA'
                ? 'R. Rainha Elizabeth, 639 – Jardim Canadá, Nova Lima – MG, CEP 34007-790'
                : state.endereco?.logradouro
                ? `${state.endereco.logradouro}, ${state.endereco.numero || 's/n'}`
                : 'Endereço fornecido pelo cliente'}
            </span>
          </div>
          <div className="text-right font-mono font-bold text-xs">
            {freteStatus === 'FIXADO' && freteValor !== null ? (
              <span className="text-amber-400">{formatarMoeda(freteValor)}</span>
            ) : freteStatus === 'GRATIS' ? (
              <span className="text-emerald-400">Grátis</span>
            ) : (
              <span className="text-amber-400/90 text-[11px] font-sans">A confirmar</span>
            )}
          </div>
        </div>
      </div>

      {/* Campo de Cupom de Desconto */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>Cupom de Desconto</span>
        </h3>

        {state.houve_barganha && state.cupom_desconto === 'ALBANOS' ? (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                ALBANOS
              </span>
              <span className="text-emerald-200">
                Cupom ALBANOS aplicado! 5% de desconto exclusivo para pagamento via PIX.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoverCupom}
              className="p-1 text-stone-400 hover:text-white transition"
              title="Remover cupom"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite o cupom (Ex.: ALBANOS)"
              value={cupomInput}
              onChange={(e) => {
                setCupomInput(e.target.value);
                setCupomErro(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAplicarCupom();
                }
              }}
              className="flex-1 bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white uppercase font-mono tracking-wider outline-none"
            />
            <button
              type="button"
              onClick={handleAplicarCupom}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        )}

        {cupomErro && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{cupomErro}</span>
          </p>
        )}
      </div>

      {/* Formas de Pagamento */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
            Forma de Pagamento <span className="text-rose-400">*</span>
          </h3>
          <span className="text-[11px] text-stone-500">Selecione para confirmar</span>
        </div>

        {erroPagamento && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{erroPagamento}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Opção PIX */}
          <button
            type="button"
            onClick={() => handleFormaPagamento('PIX')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
              state.forma_pagamento === 'PIX'
                ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50 text-white'
                : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <QrCode className="w-5 h-5 text-amber-400" />
              {state.houve_barganha && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  5% OFF
                </span>
              )}
            </div>
            <div>
              <span className="font-bold block text-xs">PIX</span>
              <span className="text-[11px] text-stone-400">À vista instantâneo (desconto exclusivo)</span>
            </div>
          </button>

          {/* Opção CARTÃO */}
          <button
            type="button"
            onClick={() => handleFormaPagamento('CARTAO')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
              state.forma_pagamento === 'CARTAO'
                ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50 text-white'
                : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] text-stone-400">1x até 12x</span>
            </div>
            <div>
              <span className="font-bold block text-xs">Cartão de Crédito</span>
              <span className="text-[11px] text-stone-400">Parcelamento flexível</span>
            </div>
          </button>
        </div>

        {/* Seleção de Parcelas do Cartão */}
        {state.forma_pagamento === 'CARTAO' && (
          <div className="p-4 bg-stone-950/90 border border-stone-800 rounded-xl space-y-3 animate-fadeIn">
            <label
              htmlFor="select-parcelas"
              className="flex items-center justify-between text-xs text-stone-300"
            >
              <span className="font-semibold">Quantidade de Parcelas: <span className="text-rose-400">*</span></span>
              <span className="text-[11px] text-stone-400">1x a 12x</span>
            </label>
            <select
              id="select-parcelas"
              value={state.parcelas_cartao ?? ''}
              onChange={(e) =>
                handleParcelasChange(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
            >
              <option value="">Selecione o número de parcelas...</option>
              {opcoesParcelamento.map((op) => (
                <option key={op.parcelas} value={op.parcelas}>
                  {op.parcelas}x de {formatarMoeda(op.valorParcela)} — total {formatarMoeda(op.totalCartao)}
                  {freteStatus === 'A_CONFIRMAR' ? ' + frete a confirmar' : ''}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-stone-400 leading-relaxed">
              {!opcaoAtual ? (
                <span className="text-amber-400 font-medium">
                  ⚠️ Por favor, selecione uma opção de parcelamento acima para calcular o valor exato.
                </span>
              ) : freteStatus === 'A_CONFIRMAR' ? (
                <span>
                  💡 Com frete a confirmar, os valores acima foram calculados sobre os produtos conhecidos e serão atualizados após a confirmação do frete pela equipe.
                </span>
              ) : (
                <span>
                  Parcelamento: <strong>{opcaoAtual.parcelas}x de {formatarMoeda(opcaoAtual.valorParcela)}</strong> (total no cartão: {formatarMoeda(opcaoAtual.totalCartao)}).
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card do Total Geral Final */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c443c]/50 via-stone-900 to-[#082d28]/40 border border-[#0c443c] ring-1 ring-amber-500/25 shadow-[0_8px_30px_rgba(12,68,60,0.35)] space-y-3 w-full min-w-0">
        {descontoValor > 0 && (
          <div className="flex items-center justify-between gap-2 text-xs text-emerald-300 pb-2 border-b border-stone-800/80">
            <span className="min-w-0 flex-1">
              Desconto cupom ALBANOS (5% exclusivo PIX{freteStatus === 'A_CONFIRMAR' ? ' sobre produtos' : ' sobre produtos + frete'}):
            </span>
            <span className="font-mono font-bold shrink-0 text-right whitespace-nowrap">
              -{formatarMoeda(descontoValor)}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
          <div className="min-w-0">
            <span className="text-base sm:text-lg uppercase tracking-wide font-bold text-amber-400 block font-['Raleway',sans-serif]">
              Total Geral
            </span>
            <span className="text-xs sm:text-sm text-stone-300 break-words block mt-0.5">
              {state.barris_total_escolhidos || 0} barris • {(state.barris_total_escolhidos || 0) * 50} L •{' '}
              {state.forma_pagamento !== 'A_DEFINIR' ? state.forma_pagamento : 'Forma de pagamento a definir'}
              {state.forma_pagamento === 'CARTAO'
                ? numParcelasAtual
                  ? ` (${numParcelasAtual}x)`
                  : ' (parcelas a definir)'
                : ''}
            </span>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white whitespace-nowrap filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {totalGeral !== null
                ? formatarMoeda(totalGeral)
                : state.forma_pagamento === 'CARTAO' && !numParcelasAtual
                ? 'Aguardando parcelas'
                : `${formatarMoeda(orcamento?.totalProdutosLiquido || (totalProdutos - descontoValor))} + Frete`}
            </span>
            {freteStatus === 'A_CONFIRMAR' && (
              <span className="text-[10px] text-amber-300 block whitespace-nowrap">
                + frete a confirmar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ações da Etapa */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="px-4 sm:px-5 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-medium transition shrink-0 cursor-pointer"
          >
            Voltar
          </button>

          <button
            type="button"
            id="btn-confirmar-pedido"
            disabled={!podeConfirmar}
            onClick={handleConfirmarPedido}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition shadow-lg text-center cursor-pointer active:scale-95 ${
              podeConfirmar
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 shadow-amber-950'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60 border border-stone-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Confirmar pedido</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {!formaPagamentoDefinida && (
          <p className="text-[11px] text-center text-amber-400/90 font-medium">
            👉 Selecione uma forma de pagamento acima para liberar a confirmação do pedido.
          </p>
        )}
      </div>
    </div>
  );
};
