/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Contrato canônico de tipos V1.1
 */

export type OutrasBebidas = 'SIM' | 'NAO';

export type CenarioQuantidade = 'JUSTO' | 'ENXUTO' | 'ABUNDANTE';

export type EstiloChope =
  | 'pilsen'
  | 'life_lager'
  | 'session_ipa'
  | 'amber'
  | 'american_ipa'
  | 'pale_ale';

export type ModalidadeLogistica = 'ENTREGA' | 'RETIRADA_FABRICA' | 'A_DEFINIR';

export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'A_DEFINIR';

export type AceiteOrcamento = 'UNKNOWN' | 'PENDENTE' | 'SIM' | 'NAO';

export type PrioridadeAtendimento = 'NORMAL' | 'URGENTE_DATA' | 'IMEDIATA';

export type HandoffTipo = 'preventivo' | 'final';

export type HandoffStatus = 'NAO_INICIADO' | 'INICIADO' | 'ATUALIZADO' | 'CONCLUIDO';

export type StatusExcecaoComercial =
  | 'NAO_SOLICITADA'
  | 'PENDENTE'
  | 'APROVADA'
  | 'NEGADA';

export interface EstiloInfo {
  id: EstiloChope;
  nome: string; // Ex: Albanos Pilsen
  estiloTecnico: string; // Ex: American Lager
  precoUnitario: number; // Por barril de 50L
  descricao: string; // Perfil sensorial oficial
  perfilSensorial: string; // Perfil sensorial detalhado da planilha do mestre cervejeiro
  isPremiado?: boolean;
  destaquePremio?: string;
  abv: string; // Teor alcoólico
  ibu: string; // Unidade de amargor
}

export interface MixBarris {
  pilsen: number;
  life_lager: number;
  session_ipa: number;
  amber: number;
  american_ipa: number;
  pale_ale: number;
}

export interface EnderecoOperacional {
  cidade: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string; // ou SEM_COMPLEMENTO
}

export interface ContatoBasico {
  nome_completo?: string;
  email?: string;
  telefone_responsavel?: string;
}

export interface FreteResultado {
  valor: number | null; // null se A_CONFIRMAR
  status: 'FIXADO' | 'A_CONFIRMAR' | 'GRATIS';
  faixaNome: string;
  detalhe?: string;
}

export interface OrcamentoSubtotalEstilo {
  estilo: EstiloChope;
  nome: string;
  barris: number;
  precoUnitario: number;
  subtotal: number;
}

export interface OrcamentoDetalhado {
  barrisTotal: number;
  litrosComerciais: number;
  itens: OrcamentoSubtotalEstilo[];
  totalProdutosBruto: number;
  descontoBarganhaValor: number;
  descontoAplicado: boolean;
  totalProdutosLiquido: number;
  frete: FreteResultado;
  formaPagamento: FormaPagamento;
  parcelasCartao?: number;
  multiplicadorCartao?: number;
  valorParcelaCartao?: number;
  totalGeral: number | null; // null se frete A_CONFIRMAR
  totalGeralFormatado: string;
  invariantesValidos: boolean;
  motivoBloqueio?: string;
}

export interface CalculatorState {
  // Metadados da sessão
  versaoContrato: string;
  origem: 'direct' | 'iara' | 'internal_team';

  // Evento e dimensionamento (Inputs)
  data_evento?: string; // YYYY-MM-DD
  horario_inicio_evento?: string; // HH:mm
  cidade?: string;
  qtd_pessoas?: number;
  qtd_adultos?: number;
  duracao_horas?: number;
  outras_bebidas_alcoolicas?: OutrasBebidas;

  // Derivados de dimensionamento
  litros_estimados?: number;
  fator_consumo_usado?: number;

  // Decisão de quantidade
  cenario_quantidade?: CenarioQuantidade;
  barris_total_escolhidos?: number;

  // Mix de barris
  mix: MixBarris;

  // Equipamentos
  precisa_chopeira: boolean;
  precisa_gas: boolean;
  qtd_chopeiras_referencia?: number;

  // Logística
  modalidade_logistica: ModalidadeLogistica;
  endereco: EnderecoOperacional;
  data_retirada?: string;
  hora_retirada?: string;
  frete: FreteResultado;

  // Revisão e Orçamento
  revisao_pre_orcamento_confirmada: boolean;
  orcamento?: OrcamentoDetalhado;
  aceite_orcamento: AceiteOrcamento;

  // Pagamento e negociação
  forma_pagamento: FormaPagamento;
  parcelas_cartao: number;
  houve_barganha: boolean;
  cupom_desconto?: string;
  descricao_excecao_comercial?: string;
  status_excecao_comercial: StatusExcecaoComercial;

  // Contato básico opcional (SEM CPF, SEM DATA NASCIMENTO)
  contato: ContatoBasico;

  // Controle e prioridade
  prioridade_atendimento: PrioridadeAtendimento;
  dias_ate_evento?: number;
  urgencia_explicita?: boolean;
  handoff_status: HandoffStatus;

  // UI State
  etapaAtual: number; // 0: loading, 1: entrada, 2: evento, 3: dimensionamento/cenarios, 4: mix, 5: equipamentos, 6: logistica, 7: revisao, 8: orcamento, 9: pagamento, 10: contato, 11: handoff
}
