/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Tela T12: Contato & Envio Direto para WhatsApp V1.1
 */

import React, { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { CalculatorState } from '../../types';
import { gerarLinkWhatsApp } from '../../businessRules/whatsappAdapter';

interface Step8BasicContactProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onBack: () => void;
  onNext?: () => void;
  onSkip?: () => void;
}

export const Step8BasicContact: React.FC<Step8BasicContactProps> = ({
  state,
  onUpdateField,
  onBack,
}) => {
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  const contato = state.contato || {};

  const estadoComContato = useMemo<CalculatorState>(() => {
    return {
      ...state,
      contato: {
        nome_completo: contato.nome_completo || '',
        telefone_responsavel: contato.telefone_responsavel || '',
        email: contato.email || '',
      },
    };
  }, [state, contato]);

  const linkWhatsApp = useMemo(() => {
    return gerarLinkWhatsApp(estadoComContato, 'final', undefined, 8, 'Contato & Finalização');
  }, [estadoComContato]);

  const dispararErro = (mensagem: string, idCampo: string, idElementoFoco?: string) => {
    setErro(mensagem);
    setCampoComErro(idCampo);

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    setTimeout(() => {
      const banner =
        document.getElementById('disclaimer-erro-step8') ||
        document.getElementById('step-contato-basico');
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

  const handleContatoChange = (campo: string, valor: string) => {
    if (campoComErro === campo) {
      setCampoComErro(null);
      setErro(null);
    }
    onUpdateField('contato', {
      ...contato,
      [campo]: valor,
    });
  };

  const handleEnviarWhatsApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setErro(null);
    setCampoComErro(null);

    // Validação de nome obrigatório
    if (!contato.nome_completo || !contato.nome_completo.trim()) {
      e.preventDefault();
      dispararErro('Por favor, informe o nome completo do responsável.', 'nome_completo', 'input-nome');
      return;
    }

    // Validação de telefone obrigatório
    const telLimpo = (contato.telefone_responsavel || '').replace(/\D/g, '');
    if (!telLimpo || telLimpo.length < 10) {
      e.preventDefault();
      dispararErro('Por favor, informe um telefone/WhatsApp válido com DDD.', 'telefone_responsavel', 'input-telefone');
      return;
    }

    // Se o usuário digitou e-mail, valida formato básico
    if (contato.email && contato.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contato.email.trim())) {
        e.preventDefault();
        dispararErro('Por favor, informe um formato de e-mail válido (ex.: seu@email.com).', 'email', 'input-email');
        return;
      }
    }

    // Atualiza estado global
    onUpdateField('contato', {
      nome_completo: (contato.nome_completo || '').trim(),
      telefone_responsavel: (contato.telefone_responsavel || '').trim(),
      email: contato.email ? contato.email.trim() : '',
    });

    setPedidoEnviado(true);
  };

  return (
    <div id="step-contato-basico" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 8 de 8 • Contato
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Contato do responsável
        </h2>
        <p className="text-xs text-stone-400">
          Informe os dados do contato do responsável pelo pedido.
        </p>
      </div>

      {erro && (
        <div
          id="disclaimer-erro-step8"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="scroll-mt-20 p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-100 text-xs sm:text-sm font-medium flex items-center gap-3 shadow-xl shadow-rose-950/70 animate-pulse outline-none"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="flex-1 font-semibold">{erro}</span>
        </div>
      )}

      {/* Formulário Simples */}
      <div className="space-y-3.5 bg-stone-950/70 p-4 rounded-xl border border-stone-800">
        <div>
          <label htmlFor="input-nome" className="flex items-center gap-2 text-xs font-semibold text-stone-200 mb-1">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Nome Completo <span className="text-rose-400">*</span></span>
          </label>
          <input
            id="input-nome"
            type="text"
            placeholder="Ex.: Lucas Mendes"
            value={contato.nome_completo || ''}
            onChange={(e) => handleContatoChange('nome_completo', e.target.value)}
            className={`w-full bg-stone-900 border rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition ${
              campoComErro === 'nome_completo'
                ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        </div>

        <div>
          <label htmlFor="input-telefone" className="flex items-center gap-2 text-xs font-semibold text-stone-200 mb-1">
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span>Telefone / WhatsApp <span className="text-rose-400">*</span></span>
          </label>
          <input
            id="input-telefone"
            type="tel"
            placeholder="Ex.: (31) 99999-9999"
            value={contato.telefone_responsavel || ''}
            onChange={(e) => handleContatoChange('telefone_responsavel', e.target.value)}
            className={`w-full bg-stone-900 border rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition ${
              campoComErro === 'telefone_responsavel'
                ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        </div>

        <div>
          <label htmlFor="input-email" className="flex items-center gap-2 text-xs font-semibold text-stone-200 mb-1">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>E-mail para envio da proposta <span className="text-stone-400 font-normal">(opcional)</span></span>
          </label>
          <input
            id="input-email"
            type="email"
            placeholder="Ex.: lucas@exemplo.com.br"
            value={contato.email || ''}
            onChange={(e) => handleContatoChange('email', e.target.value)}
            className={`w-full bg-stone-900 border rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition ${
              campoComErro === 'email'
                ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        </div>
      </div>

      {/* Confirmação de envio caso já tenha clicado */}
      {pedidoEnviado && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white block mb-0.5">Conversa iniciada!</strong>
            Se a janela do WhatsApp não tiver aberto automaticamente,{' '}
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 underline font-semibold hover:text-amber-200"
            >
              clique aqui para abrir novamente.
            </a>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-medium transition text-center"
          >
            Voltar
          </button>

          <a
            id="btn-enviar-pedido-whatsapp"
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleEnviarWhatsApp}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/80 transition transform hover:-translate-y-0.5 active:translate-y-0 text-center"
          >
            <MessageSquare className="w-4 h-4 fill-current shrink-0" />
            <span>Enviar pedido para o WhatsApp da Albanos</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
          </a>
        </div>

        {/* Aviso de Próximos Passos */}
        <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl text-[11px] text-stone-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-stone-300 block mb-0.5">Próximos passos:</strong>
            Clique no botão Enviar Pedido para encaminhar seu pedido diretamente pro time Albanos no WhatsApp. O time vai verificar a disponibilidade dos barris e equipamentos para a data do seu evento e vai passar as instruções sobre o pagamento e a entrega/retirada.
          </div>
        </div>
      </div>
    </div>
  );
};
