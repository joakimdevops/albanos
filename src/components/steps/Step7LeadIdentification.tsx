/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Etapa 7: Identificação Pré-Orçamento (Captura do Lead) V1.1
 */

import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { CalculatorState } from '../../types';

interface Step7LeadIdentificationProps {
  state: CalculatorState;
  onUpdateField: (campo: keyof CalculatorState | string, valor: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step7LeadIdentification: React.FC<Step7LeadIdentificationProps> = ({
  state,
  onUpdateField,
  onNext,
  onBack,
}) => {
  const contato = state.contato || {};
  const [nome, setNome] = useState<string>(contato.nome_completo || '');
  const [telefone, setTelefone] = useState<string>(contato.telefone_responsavel || '');
  const [email, setEmail] = useState<string>(contato.email || '');

  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  const dispararErro = (mensagem: string, idCampo: string, idElementoFoco?: string) => {
    setErro(mensagem);
    setCampoComErro(idCampo);

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    setTimeout(() => {
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

  const handleNomeChange = (val: string) => {
    setNome(val);
    if (campoComErro === 'nome_completo') {
      setCampoComErro(null);
      setErro(null);
    }
  };

  const handleTelefoneChange = (val: string) => {
    setTelefone(val);
    if (campoComErro === 'telefone_responsavel') {
      setCampoComErro(null);
      setErro(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (campoComErro === 'email') {
      setCampoComErro(null);
      setErro(null);
    }
  };

  const handleAvancar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCampoComErro(null);

    // 1. Validação de Nome (Obrigatório)
    const nomeTrim = nome.trim();
    if (!nomeTrim || nomeTrim.length < 3) {
      dispararErro('Por favor, informe seu nome completo.', 'nome_completo', 'input-nome');
      return;
    }

    // 2. Validação de Telefone / WhatsApp com DDD (Obrigatório)
    const digitosTel = telefone.replace(/\D/g, '');
    if (digitosTel.length < 10 || digitosTel.length > 11) {
      dispararErro(
        'Por favor, informe um telefone/WhatsApp válido com DDD (Ex.: 31 99999-9999).',
        'telefone_responsavel',
        'input-telefone'
      );
      return;
    }

    // 3. Validação de E-mail (Opcional: vazio não bloqueia; se preenchido, valida formato)
    const emailTrim = email.trim();
    if (emailTrim.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrim)) {
        dispararErro(
          'Por favor, informe um endereço de e-mail válido ou deixe o campo em branco.',
          'email',
          'input-email'
        );
        return;
      }
    }

    // Persiste os dados de contato no estado da aplicação
    onUpdateField('contato', {
      nome_completo: nomeTrim,
      telefone_responsavel: telefone.trim(),
      email: emailTrim || undefined,
    });

    onNext();
  };

  return (
    <div id="step-identificacao-lead" className="max-w-xl mx-auto space-y-6 py-4 px-4">
      {/* Header da Etapa */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Etapa 7 de 8 • Identificação do Responsável
        </span>
        <h2 className="text-2xl font-bold text-white font-['Raleway',sans-serif]">
          Identificação para sua cotação
        </h2>
        <p className="text-xs text-stone-400">
          Informe seu nome e telefone para gerarmos a cotação personalizada com todas as condições da Albanos.
        </p>
      </div>

      {/* Banner de Erro Resiliente */}
      {erro && (
        <div
          id="disclaimer-erro-identificacao"
          className="p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-fadeIn shadow-lg shadow-rose-950/30"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{erro}</div>
        </div>
      )}

      {/* Formulário de Identificação */}
      <form onSubmit={handleAvancar} className="space-y-4 bg-stone-950/70 p-5 rounded-2xl border border-stone-800 shadow-xl">
        {/* Nome Completo (Obrigatório) */}
        <div>
          <label
            htmlFor="input-nome"
            className="flex items-center justify-between text-xs font-semibold text-stone-200 mb-1.5"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Nome Completo <span className="text-rose-400">*</span>
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-normal">Obrigatório</span>
          </label>
          <input
            id="input-nome"
            type="text"
            placeholder="Ex.: Lucas Mendes"
            value={nome}
            onChange={(e) => handleNomeChange(e.target.value)}
            className={`w-full bg-stone-900 border rounded-xl px-4 py-3 text-xs text-white outline-none transition ${
              campoComErro === 'nome_completo'
                ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        </div>

        {/* Telefone / WhatsApp com DDD (Obrigatório) */}
        <div>
          <label
            htmlFor="input-telefone"
            className="flex items-center justify-between text-xs font-semibold text-stone-200 mb-1.5"
          >
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Telefone / WhatsApp <span className="text-rose-400">*</span>
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-normal">Com DDD</span>
          </label>
          <input
            id="input-telefone"
            type="tel"
            placeholder="Ex.: (31) 99999-9999"
            value={telefone}
            onChange={(e) => handleTelefoneChange(e.target.value)}
            className={`w-full bg-stone-900 border rounded-xl px-4 py-3 text-xs text-white outline-none transition ${
              campoComErro === 'telefone_responsavel'
                ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        </div>

        {/* E-mail (Opcional) */}
        <div>
          <label
            htmlFor="input-email"
            className="flex items-center justify-between text-xs font-semibold text-stone-200 mb-1.5"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>E-mail</span>
            </div>
            <span className="text-[11px] text-stone-500 font-normal">Opcional</span>
          </label>
          <input
            id="input-email"
            type="email"
            placeholder="Ex.: lucas@exemplo.com.br"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full bg-stone-900 border rounded-xl px-4 py-3 text-xs text-white outline-none transition ${
              campoComErro === 'email'
                ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
          <p className="text-[11px] text-stone-500 mt-1">
            Podemos enviar uma cópia da cotação por e-mail.
          </p>
        </div>

        {/* Aviso de Privacidade e Segurança */}
        <div className="p-3 bg-gradient-to-r from-[#0c443c]/35 via-stone-950 to-stone-950 border border-[#0c443c]/50 rounded-xl text-[11px] text-stone-300 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-stone-300 font-medium">Seus dados estão seguros.</span>
        </div>

        {/* Ações */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-medium transition cursor-pointer"
          >
            Voltar
          </button>

          <button
            type="submit"
            id="btn-avancar-orcamento"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-950 cursor-pointer active:scale-95"
          >
            <span>Avançar para a Cotação</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
