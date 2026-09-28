/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Adaptador de URL (Iara -> Calculator) V1.1
 */

import {
  CalculatorState,
  CenarioQuantidade,
  FormaPagamento,
  ModalidadeLogistica,
  OutrasBebidas,
} from '../types';
import { CONTRACT_VERSION, ESTADO_INICIAL } from './domainConfig';
import { aplicarMudancaEstado, calcularPrioridade } from './dependenciesEngine';
import { calcularDimensionamento } from './dimensioningEngine';
import { calcularFrete } from './freightEngine';
import { somarBarrisMix, validarInvarianteMix } from './mixEngine';
import {
  validarDataLogistica,
  validarDataRetiradaFabrica,
  validarHorarioLogistica,
} from './logisticsEngine';

export interface URLImportResultado {
  sucesso: boolean;
  parametrosValidos: number;
  parametrosIgnorados: number;
  primeiraEtapaPendente: number;
  novoEstado: CalculatorState;
  detalhes: string[];
}

/**
 * Cria um estado inicial limpo e canônico para a sessão reutilizando ESTADO_INICIAL.
 */
export function criarEstadoInicial(): CalculatorState {
  return {
    ...ESTADO_INICIAL,
    mix: { ...ESTADO_INICIAL.mix },
    endereco: { ...ESTADO_INICIAL.endereco },
    frete: { ...ESTADO_INICIAL.frete },
    contato: { ...ESTADO_INICIAL.contato },
  };
}

/**
 * Faz a importação estrita e segura de parâmetros de busca (query string) da URL.
 * Rejeita explicitamente CPF, nascimento, PII, valores derivados e não-allowlisted.
 */
export function importarParametrosURL(
  searchParams: URLSearchParams,
  estadoBase?: CalculatorState
): URLImportResultado {
  let estado = estadoBase ? { ...estadoBase } : criarEstadoInicial();
  let parametrosValidos = 0;
  let parametrosIgnorados = 0;
  const detalhes: string[] = [];

  // 1. Origem
  const src = searchParams.get('src');
  if (src === 'iara') {
    estado.origem = 'iara';
    parametrosValidos++;
  } else if (src === 'internal_team') {
    estado.origem = 'internal_team';
    parametrosValidos++;
  }

  // 2. Parâmetros explicitamente proibidos
  const camposProibidos = ['cpf', 'data_nascimento', 'nascimento', 'litros_estimados', 'total', 'subtotal', 'frete', 'aceite_orcamento'];
  for (const proibido of camposProibidos) {
    if (searchParams.has(proibido)) {
      parametrosIgnorados++;
      detalhes.push(`Parâmetro derivado/proibido '${proibido}' rejeitado por segurança.`);
    }
  }

  // 3. Data do evento
  const dataEvento = searchParams.get('data_evento');
  if (dataEvento && /^\d{4}-\d{2}-\d{2}$/.test(dataEvento)) {
    estado.data_evento = dataEvento;
    const { prioridade, diasAteEvento } = calcularPrioridade(dataEvento);
    estado.prioridade_atendimento = prioridade;
    estado.dias_ate_evento = diasAteEvento;
    parametrosValidos++;
  }

  // 3.1 Horário de início do evento (HH:mm)
  const horarioInicio = searchParams.get('horario_inicio_evento');
  if (horarioInicio && /^\d{1,2}:\d{2}$/.test(horarioInicio)) {
    estado.horario_inicio_evento = horarioInicio;
    parametrosValidos++;
  }

  // 4. Cidade
  const cidade = searchParams.get('cidade');
  if (cidade && cidade.trim().length > 0 && cidade.length <= 100) {
    estado.cidade = cidade.trim();
    estado.endereco.cidade = cidade.trim();
    estado.frete = calcularFrete(estado.modalidade_logistica, estado.cidade);
    parametrosValidos++;
  }

  // 5. Total de pessoas e adultos
  const qtdPessoas = searchParams.get('qtd_pessoas');
  if (qtdPessoas && !isNaN(Number(qtdPessoas)) && Number(qtdPessoas) >= 0) {
    estado.qtd_pessoas = Math.floor(Number(qtdPessoas));
    parametrosValidos++;
  }

  const qtdAdultos = searchParams.get('qtd_adultos');
  if (qtdAdultos && !isNaN(Number(qtdAdultos)) && Number(qtdAdultos) >= 0) {
    estado.qtd_adultos = Math.floor(Number(qtdAdultos));
    parametrosValidos++;
  }

  // 6. Duração em horas (inteiro de 1 a 12)
  const duracao = searchParams.get('duracao_horas');
  if (duracao && !isNaN(Number(duracao))) {
    const dInt = Math.round(Number(duracao));
    if (dInt >= 1 && dInt <= 12) {
      estado.duracao_horas = dInt;
      parametrosValidos++;
    }
  }

  // 6.1 Evento longo (> 12h ou múltiplos dias)
  const eventoLongo =
    searchParams.get('evento_longo') ||
    searchParams.get('evento_longo_ou_multiplos_dias');
  if (eventoLongo === 'true' || eventoLongo === 'SIM' || eventoLongo === '1') {
    estado.evento_longo_ou_multiplos_dias = true;
    parametrosValidos++;
  }

  // 7. Outras bebidas alcoólicas (SIM | NAO)
  const outrasBebidas = searchParams.get('outras_bebidas_alcoolicas');
  if (outrasBebidas === 'SIM' || outrasBebidas === 'NAO') {
    estado.outras_bebidas_alcoolicas = outrasBebidas as OutrasBebidas;
    parametrosValidos++;
  }

  // Se tiver adultos, duração e outras bebidas -> recalcula litros_estimados localmente!
  if (estado.qtd_adultos && estado.duracao_horas && estado.outras_bebidas_alcoolicas) {
    try {
      const dim = calcularDimensionamento(
        estado.qtd_adultos,
        estado.duracao_horas,
        estado.outras_bebidas_alcoolicas
      );
      estado.litros_estimados = dim.litrosEstimados;
      estado.fator_consumo_usado = dim.fatorConsumo;
    } catch {
      // Ignora erro de dimensionamento silenciosamente
    }
  }

  // 8. Barris total escolhidos
  const barrisTotal = searchParams.get('barris_total_escolhidos');
  if (barrisTotal && !isNaN(Number(barrisTotal)) && Number(barrisTotal) > 0) {
    estado.barris_total_escolhidos = Math.floor(Number(barrisTotal));
    parametrosValidos++;
  }

  // 9. Cenário de quantidade
  const cenario = searchParams.get('cenario_quantidade');
  if (cenario === 'JUSTO' || cenario === 'ENXUTO' || cenario === 'ABUNDANTE') {
    estado.cenario_quantidade = cenario as CenarioQuantidade;
    parametrosValidos++;
  }

  // 10. Mix por estilo (só aceito se todos forem válidos e baterem com barrisTotal)
  const pilsen = searchParams.get('barris_pilsen');
  const session = searchParams.get('barris_session_ipa');
  const amber = searchParams.get('barris_amber');
  const life = searchParams.get('barris_life_lager');
  const american = searchParams.get('barris_american_ipa');
  const pale = searchParams.get('barris_pale_ale');

  if (
    pilsen !== null ||
    session !== null ||
    amber !== null ||
    life !== null ||
    american !== null ||
    pale !== null
  ) {
    const novoMix = {
      pilsen: pilsen ? Math.max(0, parseInt(pilsen, 10)) : 0,
      session_ipa: session ? Math.max(0, parseInt(session, 10)) : 0,
      amber: amber ? Math.max(0, parseInt(amber, 10)) : 0,
      life_lager: life ? Math.max(0, parseInt(life, 10)) : 0,
      american_ipa: american ? Math.max(0, parseInt(american, 10)) : 0,
      pale_ale: pale ? Math.max(0, parseInt(pale, 10)) : 0,
    };

    if (estado.barris_total_escolhidos) {
      const validacao = validarInvarianteMix(novoMix, estado.barris_total_escolhidos);
      if (validacao.valido) {
        estado.mix = novoMix;
        parametrosValidos++;
      } else {
        parametrosIgnorados++;
        detalhes.push('Mix recebido por URL não fecha com barris_total_escolhidos. Sugestão automática mantida.');
      }
    }
  }

  // 11. Equipamentos
  const chopeira = searchParams.get('precisa_chopeira');
  if (chopeira === 'SIM' || chopeira === 'NAO' || chopeira === 'true' || chopeira === 'false') {
    estado.precisa_chopeira = chopeira === 'SIM' || chopeira === 'true';
    parametrosValidos++;
  }

  const gas = searchParams.get('precisa_gas');
  if (gas === 'SIM' || gas === 'NAO' || gas === 'true' || gas === 'false') {
    estado.precisa_gas = gas === 'SIM' || gas === 'true';
    parametrosValidos++;
  }

  // 12. Modalidade logística
  const modalidade = searchParams.get('modalidade_logistica');
  if (modalidade === 'ENTREGA' || modalidade === 'RETIRADA_FABRICA' || modalidade === 'A_DEFINIR') {
    estado.modalidade_logistica = modalidade as ModalidadeLogistica;
    estado.frete = calcularFrete(estado.modalidade_logistica, estado.cidade);
    parametrosValidos++;
  }

  // 12.1 Dados de Endereço (quando entrega)
  const logradouro = searchParams.get('logradouro');
  if (logradouro && logradouro.trim().length > 0) {
    estado.endereco = {
      ...estado.endereco,
      logradouro: logradouro.trim(),
    };
    parametrosValidos++;
  }
  const numero = searchParams.get('numero');
  if (numero && numero.trim().length > 0) {
    estado.endereco = {
      ...estado.endereco,
      numero: numero.trim(),
    };
    parametrosValidos++;
  }
  const bairro = searchParams.get('bairro');
  if (bairro && bairro.trim().length > 0) {
    estado.endereco = {
      ...estado.endereco,
      bairro: bairro.trim(),
    };
    parametrosValidos++;
  }

  // 13. Data/hora de entrega (quando entrega)
  const dataEntrega = searchParams.get('data_entrega');
  if (dataEntrega && /^\d{4}-\d{2}-\d{2}$/.test(dataEntrega)) {
    estado.data_entrega = dataEntrega;
    parametrosValidos++;
  }
  const horaEntrega = searchParams.get('hora_entrega');
  if (horaEntrega) {
    estado.hora_entrega = horaEntrega.slice(0, 10).trim();
    parametrosValidos++;
  }

  // 14. Data/hora de retirada (quando retirada)
  const dataRetirada = searchParams.get('data_retirada');
  if (dataRetirada && /^\d{4}-\d{2}-\d{2}$/.test(dataRetirada)) {
    estado.data_retirada = dataRetirada;
    parametrosValidos++;
  }
  const horaRetirada = searchParams.get('hora_retirada');
  if (horaRetirada) {
    estado.hora_retirada = horaRetirada.slice(0, 10).trim();
    parametrosValidos++;
  }

  // 15. Forma de pagamento (somente PIX ou CARTAO)
  const formaPagamento = searchParams.get('forma_pagamento');
  if (formaPagamento === 'PIX' || formaPagamento === 'CARTAO') {
    estado.forma_pagamento = formaPagamento as FormaPagamento;
    parametrosValidos++;
  }

  const parcelas = searchParams.get('parcelas_cartao');
  if (parcelas && !isNaN(Number(parcelas))) {
    const p = Math.floor(Number(parcelas));
    if (p >= 1 && p <= 12) {
      estado.parcelas_cartao = p;
      parametrosValidos++;
    }
  }

  // 16. Contato (Identificação do Lead)
  const nomeContato = searchParams.get('nome_completo') || searchParams.get('nome');
  if (nomeContato && nomeContato.trim().length >= 2) {
    estado.contato = {
      ...estado.contato,
      nome_completo: nomeContato.trim(),
    };
    parametrosValidos++;
  }

  const telContato = searchParams.get('telefone_responsavel') || searchParams.get('telefone');
  if (telContato && telContato.replace(/\D/g, '').length >= 10) {
    estado.contato = {
      ...estado.contato,
      telefone_responsavel: telContato.trim(),
    };
    parametrosValidos++;
  }

  const emailContato = searchParams.get('email');
  if (emailContato && emailContato.trim().length > 0) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContato.trim())) {
      estado.contato = {
        ...estado.contato,
        email: emailContato.trim(),
      };
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('E-mail em formato inválido ignorado na URL.');
    }
  }

  // 17. Flag de Revisão Confirmada via URL (se vier de deep-link avançado)
  const revisaoConf = searchParams.get('revisao_pre_orcamento_confirmada');
  if (revisaoConf === 'true' || revisaoConf === 'SIM' || revisaoConf === '1') {
    estado.revisao_pre_orcamento_confirmada = true;
    parametrosValidos++;
  }

  // 18. Posicionar usuário no primeiro ponto que ainda exige decisão humana
  // Mapeamento idêntico às etapas do App.tsx:
  // 0: Início
  // 1: Dados do Evento (se faltar data_evento, horario_inicio_evento, qtd_adultos, duracao_horas, outras_bebidas_alcoolicas ou cidade)
  // 2: Dimensionamento & Cenários (se faltar escolher barris_total_escolhidos)
  // 3: Portfólio & Mix de Chope (se o mix não fechar com barris_total_escolhidos)
  // 4: Equipamentos (se faltar resposta explícita para precisa_chopeira ou precisa_gas)
  // 5: Logística & Frete (se modalidade_logistica for A_DEFINIR, ou se entrega faltar endereço/data/hora válidas, ou se retirada faltar data/hora válidas)
  // 6: Revisão Pré-Orçamento (se todos os dados anteriores já estiverem satisfeitos e revisão ainda não foi confirmada)
  // 7: Identificação do Lead (se revisão estiver confirmada mas faltar nome_completo ou telefone_responsavel)
  // 8: Orçamento & Pagamento (se lead já identificado e orçamento pronto para aceite e fechamento)
  let primeiraEtapaPendente = 1; // Padrão seguro ao chegar via URL com parâmetros: Etapa 1 (Evento)

  if (
    !estado.data_evento ||
    !estado.horario_inicio_evento ||
    !estado.qtd_adultos ||
    (!estado.duracao_horas && !estado.evento_longo_ou_multiplos_dias) ||
    !estado.outras_bebidas_alcoolicas ||
    !estado.cidade
  ) {
    primeiraEtapaPendente = 1;
  } else if (!estado.barris_total_escolhidos) {
    primeiraEtapaPendente = 2;
  } else if (!validarInvarianteMix(estado.mix, estado.barris_total_escolhidos).valido) {
    primeiraEtapaPendente = 3;
  } else if (estado.precisa_chopeira === undefined || estado.precisa_gas === undefined) {
    primeiraEtapaPendente = 4;
  } else if (
    !estado.modalidade_logistica ||
    estado.modalidade_logistica === 'A_DEFINIR' ||
    (estado.modalidade_logistica === 'ENTREGA' &&
      (!estado.endereco ||
        !estado.endereco.logradouro ||
        !estado.endereco.logradouro.trim() ||
        !estado.endereco.numero ||
        !estado.endereco.numero.trim() ||
        !estado.endereco.bairro ||
        !estado.endereco.bairro.trim() ||
        !estado.data_entrega ||
        !estado.data_entrega.trim() ||
        !validarDataLogistica(estado.data_entrega, estado.data_evento, undefined, 'entrega').valido ||
        !estado.hora_entrega ||
        !estado.hora_entrega.trim() ||
        !validarHorarioLogistica(
          estado.hora_entrega,
          estado.data_entrega,
          estado.data_evento,
          estado.horario_inicio_evento,
          'entrega'
        ).valido)) ||
    (estado.modalidade_logistica === 'RETIRADA_FABRICA' &&
      (!estado.data_retirada ||
        !estado.data_retirada.trim() ||
        !validarDataLogistica(estado.data_retirada, estado.data_evento, undefined, 'retirada').valido ||
        !estado.hora_retirada ||
        !estado.hora_retirada.trim() ||
        !validarHorarioLogistica(
          estado.hora_retirada,
          estado.data_retirada,
          estado.data_evento,
          estado.horario_inicio_evento,
          'retirada'
        ).valido))
  ) {
    primeiraEtapaPendente = 5;
  } else if (!estado.revisao_pre_orcamento_confirmada) {
    primeiraEtapaPendente = 6; // Todos os dados necessários preenchidos -> Revisão pré-orçamento
  } else if (
    !estado.contato ||
    !estado.contato.nome_completo ||
    !estado.contato.nome_completo.trim() ||
    !estado.contato.telefone_responsavel ||
    !estado.contato.telefone_responsavel.trim()
  ) {
    primeiraEtapaPendente = 7; // Identificação do Lead (Nome e Telefone)
  } else {
    primeiraEtapaPendente = 8; // Orçamento & Condições de Pagamento
  }

  estado.etapaAtual = primeiraEtapaPendente;

  return {
    sucesso: parametrosValidos > 0,
    parametrosValidos,
    parametrosIgnorados,
    primeiraEtapaPendente,
    novoEstado: estado,
    detalhes,
  };
}

/**
 * Função utilitária para converter queryString em URLSearchParams
 */
export function parsearParametrosUrl(search: string): URLSearchParams {
  const query = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(query);
}

/**
 * Aplica os parâmetros de URL sobre um estado base
 */
export function aplicarParametrosUrlNoEstado(
  estadoBase: CalculatorState,
  params: URLSearchParams
): CalculatorState {
  const resultado = importarParametrosURL(params, estadoBase);
  return resultado.novoEstado;
}
