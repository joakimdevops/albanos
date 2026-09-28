/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Aplicação Principal V1.1
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CalculatorState } from './types';
import { ESTADO_INICIAL } from './businessRules/domainConfig';
import { aplicarMudancaEstado } from './businessRules/dependenciesEngine';
import { parsearParametrosUrl, importarParametrosURL } from './businessRules/urlAdapter';

// Componentes da Interface
import { HeaderNav } from './components/HeaderNav';
import { TulipaLoading } from './components/TulipaLoading';
import { CalculationExplanationModal } from './components/CalculationExplanationModal';
import { LeadCheckpointModal } from './components/LeadCheckpointModal';
import { EngineTestRunnerModal } from './components/EngineTestRunnerModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import {
  carregarSessaoDoLocalStorage,
  salvarSessaoNoLocalStorage,
  limparSessaoDoLocalStorage,
  temDadosPreenchidos,
  ALBANOS_STORAGE_KEY,
} from './businessRules/persistence';

// Telas de cada Etapa
import { Step0Entry } from './components/steps/Step0Entry';
import { Step1Event } from './components/steps/Step1Event';
import { Step2Dimensioning } from './components/steps/Step2Dimensioning';
import { Step3Mix } from './components/steps/Step3Mix';
import { Step4Equipment } from './components/steps/Step4Equipment';
import { Step5Logistics } from './components/steps/Step5Logistics';
import { Step6Review } from './components/steps/Step6Review';
import { Step7LeadIdentification } from './components/steps/Step7LeadIdentification';
import { Step8Budget } from './components/steps/Step8Budget';

const TITULOS_ETAPAS: Record<number, string> = {
  0: 'Início',
  1: 'Dados do Evento',
  2: 'Dimensionamento & Cenários',
  3: 'Portfólio & Mix de Chope',
  4: 'Equipamentos',
  5: 'Logística & Frete',
  6: 'Revisão Pré-Cotação',
  7: 'Identificação',
  8: 'Cotação & Pagamento',
};

export default function App() {
  // Carregamento inicial resiliente da sessão no LocalStorage
  const sessaoInicial = useMemo(() => carregarSessaoDoLocalStorage(), []);

  const [etapaAtual, setEtapaAtual] = useState<number>(() => {
    return sessaoInicial?.etapaAtual ?? 0;
  });
  const [state, setState] = useState<CalculatorState>(() => {
    return sessaoInicial?.state ?? ESTADO_INICIAL;
  });
  // Se o usuário já avançou nas etapas (> 0), pula a introdução de 6s
  const [loadingInicial, setLoadingInicial] = useState<boolean>(() => {
    return !sessaoInicial || sessaoInicial.etapaAtual === 0;
  });
  const [loadingTransicaoOrcamento, setLoadingTransicaoOrcamento] = useState<boolean>(false);

  // Modais
  const [modalExplicacaoAberto, setModalExplicacaoAberto] = useState(false);
  const [modalPreservarLeadAberto, setModalPreservarLeadAberto] = useState(false);
  const [modalAuditoriaAberto, setModalAuditoriaAberto] = useState(false);
  const [modalConfirmarResetAberto, setModalConfirmarResetAberto] = useState(false);

  // Hidratação via Parâmetros de URL (Integração Iara / campanhas externas)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = parsearParametrosUrl(window.location.search);
        const hasParams =
          params &&
          (typeof params.size === 'number' ? params.size > 0 : Array.from(params.keys()).length > 0);

        if (hasParams) {
          const resultado = importarParametrosURL(params, sessaoInicial?.state ?? ESTADO_INICIAL);
          if (resultado.sucesso) {
            setState(resultado.novoEstado);
            setEtapaAtual(resultado.primeiraEtapaPendente);
            if (resultado.primeiraEtapaPendente > 0) {
              setLoadingInicial(false);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao processar parâmetros da URL:', e);
    }
  }, [sessaoInicial]);

  // Persistência contínua: grava automaticamente o progresso a cada alteração
  useEffect(() => {
    salvarSessaoNoLocalStorage(state, etapaAtual);
  }, [state, etapaAtual]);

  // Atualizador com Matriz de Dependências e Invalidação Parcial
  const handleUpdateField = useCallback((campo: keyof CalculatorState | string, valor: any) => {
    setState((prev) => aplicarMudancaEstado(prev, campo, valor));
  }, []);

  // Navegação
  const handleNext = () => {
    setEtapaAtual((prev) => Math.min(9, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setEtapaAtual((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToStep = (etapa: number) => {
    setEtapaAtual(etapa);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSolicitarReinicio = () => {
    setModalConfirmarResetAberto(true);
  };

  // Acesso secreto ao painel de testes/auditoria via triplo clique no rodapé
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef<number>(0);

  const handleFooterSecretAudit = (e: React.MouseEvent) => {
    if (!import.meta.env.DEV) return;

    // Verificação nativa para múltiplos cliques no DOM (e.detail === 3)
    if (e.detail === 3) {
      setModalAuditoriaAberto(true);
      clickCountRef.current = 0;
      return;
    }

    // Fallback acumulativo de cliques em janela de 600ms (funciona tanto no touch/mobile quanto mouse)
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      setModalAuditoriaAberto(true);
      clickCountRef.current = 0;
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 600);
    }
  };

  const handleExecutarResetModoFabrica = () => {
    // 1. Limpa todas as instâncias de armazenamento local e sessão
    limparSessaoDoLocalStorage();
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ALBANOS_STORAGE_KEY);
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Erro ao limpar storage durante o reset de fábrica:', e);
    }

    // 2. Reseta o estado React imediatamente para o estado padrão
    setState(ESTADO_INICIAL);
    setEtapaAtual(0);
    setModalConfirmarResetAberto(false);

    // 3. Garante recarregamento limpo da página na home em "modo fábrica"
    if (typeof window !== 'undefined') {
      const homeUrl = window.location.origin + window.location.pathname;
      if (window.location.href !== homeUrl) {
        window.location.href = homeUrl;
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Loading Lúdico com Tulipa de Chope Animada - Entrada */}
      {loadingInicial && (
        <TulipaLoading onComplete={() => setLoadingInicial(false)} duracaoMs={6400} />
      )}

      {/* Loading Lúdico da Tulipa ao avançar da Etapa 6 para a Etapa 7 (Geração da Cotação) */}
      {loadingTransicaoOrcamento && (
        <TulipaLoading
          titulo="Calculando cotação..."
          subtitulo="Auditando parâmetros, estilos e regras comerciais Albanos..."
          duracaoMs={3800}
          textoPular="Ver cotação agora &rarr;"
          frases={[
            {
              id: 'dados',
              minPct: 0,
              maxPct: 20,
              frase: 'Consolidando dados e perfil do seu evento...',
            },
            {
              id: 'barris',
              minPct: 20,
              maxPct: 40,
              frase: 'Dimensionando os barris de 50 L e mix escolhido...',
            },
            {
              id: 'equipamentos',
              minPct: 40,
              maxPct: 65,
              frase: 'Vinculando estrutura de chopeiras e cilindros...',
            },
            {
              id: 'logistica',
              minPct: 65,
              maxPct: 85,
              frase: 'Aplicando tabela de frete e rota logística...',
            },
            {
              id: 'finalizando',
              minPct: 85,
              maxPct: 100,
              frase: 'Cotação auditável pronta! Tim-tim! 🍻',
            },
          ]}
          onComplete={() => {
            setLoadingTransicaoOrcamento(false);
            setEtapaAtual(8);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Header Fixo com Indicador de Progresso */}
      <HeaderNav
        currentStep={etapaAtual}
        totalSteps={8}
        stepTitle={TITULOS_ETAPAS[etapaAtual] || ''}
        canGoBack={etapaAtual > 0 && etapaAtual <= 8}
        onBack={handleBack}
        onRestart={handleSolicitarReinicio}
        onOpenWhatsAppHelp={() => setModalPreservarLeadAberto(true)}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col justify-start py-2 sm:py-6 w-full max-w-full overflow-x-hidden">
        {etapaAtual === 0 && (
          <Step0Entry
            onStart={() => setEtapaAtual(1)}
            onResume={() => {
              const etapaAlvo =
                sessaoInicial?.etapaAtual && sessaoInicial.etapaAtual > 0
                  ? sessaoInicial.etapaAtual
                  : 1;
              setEtapaAtual(etapaAlvo);
            }}
            onClearSaved={handleSolicitarReinicio}
            savedStep={sessaoInicial?.etapaAtual}
            savedStepTitle={
              sessaoInicial?.etapaAtual ? TITULOS_ETAPAS[sessaoInicial.etapaAtual] : undefined
            }
            hasSavedData={temDadosPreenchidos(sessaoInicial)}
          />
        )}

        {etapaAtual === 1 && (
          <Step1Event
            state={state}
            onUpdateField={handleUpdateField}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {etapaAtual === 2 && (
          <Step2Dimensioning
            state={state}
            onUpdateField={handleUpdateField}
            onOpenExplanation={() => setModalExplicacaoAberto(true)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {etapaAtual === 3 && (
          <Step3Mix
            state={state}
            onUpdateField={handleUpdateField}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {etapaAtual === 4 && (
          <Step4Equipment
            state={state}
            onUpdateField={handleUpdateField}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {etapaAtual === 5 && (
          <Step5Logistics
            state={state}
            onUpdateField={handleUpdateField}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {etapaAtual === 6 && (
          <Step6Review
            state={state}
            onConfirmReview={() => {
              // Confirma explicitamente a conferência pré-orçamento e avança para a identificação do lead
              handleUpdateField('revisao_pre_orcamento_confirmada', true);
              setEtapaAtual(7);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToStep={(e) => handleGoToStep(e)}
            onBack={handleBack}
          />
        )}

        {etapaAtual === 7 && (
          <Step7LeadIdentification
            state={state}
            onUpdateField={handleUpdateField}
            onNext={() => {
              // Após preencher nome e telefone obrigatórios, ativa o loading de geração do orçamento
              setLoadingTransicaoOrcamento(true);
            }}
            onBack={handleBack}
          />
        )}

        {etapaAtual === 8 && (
          <Step8Budget
            state={state}
            onUpdateField={handleUpdateField}
            onGoToStep={(e) => handleGoToStep(e)}
            onBack={handleBack}
          />
        )}
      </main>

      {/* Footer Oficial com Detalhe do Logo Albanos */}
      <footer className="py-6 border-t border-[#0c443c]/40 bg-gradient-to-b from-stone-950 via-[#0c443c]/15 to-[#051e1a]/40 text-stone-400 text-xs mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://i.postimg.cc/NFnKrBLb/logo-albanos-SO-LOGO-SEM-FUNDO-3.png"
              alt="Cervejaria Albanos"
              className="h-10 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(193,160,27,0.35)]"
            />
            <div className="text-left">
              <div className="font-bold text-stone-200 tracking-wide font-['Raleway',sans-serif] text-sm flex items-center gap-2">
                <span>Cervejaria Albanos do Brasil</span>
              </div>
              <div className="text-[11px] text-stone-500">
                Sabor, inovação e afeto em cada gole | Desde 1996
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:items-end text-center sm:text-right gap-0.5 text-[11px] text-stone-500">
            <span
              onClick={handleFooterSecretAudit}
              className="text-amber-400 font-semibold font-['Raleway',sans-serif] select-none cursor-default active:text-amber-300 transition-colors"
              title="Cervejaria Albanos"
            >
              Albano's Chopp Calculator V1.1
            </span>
            <span>Feito com ♥ pel'O Forno.</span>
          </div>
        </div>
      </footer>

      {/* Modais Globais */}
      <CalculationExplanationModal
        isOpen={modalExplicacaoAberto}
        onClose={() => setModalExplicacaoAberto(false)}
        state={state}
      />

      <LeadCheckpointModal
        isOpen={modalPreservarLeadAberto}
        onClose={() => setModalPreservarLeadAberto(false)}
        state={state}
        currentStep={etapaAtual}
        stepTitle={TITULOS_ETAPAS[etapaAtual]}
      />

      {import.meta.env.DEV && (
        <EngineTestRunnerModal
          isOpen={modalAuditoriaAberto}
          onClose={() => setModalAuditoriaAberto(false)}
        />
      )}

      <ResetConfirmModal
        isOpen={modalConfirmarResetAberto}
        onClose={() => setModalConfirmarResetAberto(false)}
        onConfirmReset={handleExecutarResetModoFabrica}
      />
    </div>
  );
}
