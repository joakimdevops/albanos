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
import { CONTRACT_VERSION } from './domainConfig';
import { aplicarMudancaEstado, calcularPrioridade } from './dependenciesEngine';
import { calcularDimensionamento } from './dimensioningEngine';
import { calcularFrete } from './freightEngine';
import { somarBarrisMix, validarInvarianteMix } from './mixEngine';

export interface URLImportResultado {
  sucesso: boolean;
  parametrosValidos: number;
  parametrosIgnorados: number;
  primeiraEtapaPendente: number;
  novoEstado: CalculatorState;
  detalhes: string[];
}

/**
 * Cria um estado inicial limpo e canônico para a sessão.
 */
export function criarEstadoInicial(): CalculatorState {
  return {
    versaoContrato: CONTRACT_VERSION,
    origem: 'direct',
    cidade: 'Belo Horizonte',
    duracao_horas: 4,
    precisa_chopeira: true,
    precisa_gas: true,
    modalidade_logistica: 'ENTREGA',
    endereco: {
      cidade: 'Belo Horizonte',
      logradouro: '',
      numero: '',
      bairro: '',
      complemento: '',
    },
    mix: {
      pilsen: 0,
      life_lager: 0,
      session_ipa: 0,
      amber: 0,
      american_ipa: 0,
      pale_ale: 0,
    },
    frete: calcularFrete('ENTREGA', 'Belo Horizonte'),
    revisao_pre_orcamento_confirmada: false,
    aceite_orcamento: 'UNKNOWN',
    forma_pagamento: 'A_DEFINIR',
    parcelas_cartao: 1,
    houve_barganha: false,
    status_excecao_comercial: 'NAO_SOLICITADA',
    contato: {},
    prioridade_atendimento: 'NORMAL',
    handoff_status: 'NAO_INICIADO',
    etapaAtual: 1, // T1 Entrada
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
  } else if (src === 'internal_team') {
    estado.origem = 'internal_team';
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

  // 6. Duração em horas
  const duracao = searchParams.get('duracao_horas');
  if (duracao && !isNaN(Number(duracao)) && Number(duracao) > 0 && Number(duracao) <= 12) {
    estado.duracao_horas = Number(duracao);
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

  if (pilsen !== null || session !== null || amber !== null) {
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
  if (chopeira === 'SIM' || chopeira === 'NAO') {
    estado.precisa_chopeira = chopeira === 'SIM';
    if (estado.precisa_chopeira && estado.barris_total_escolhidos) {
      estado.qtd_chopeiras_referencia = Math.ceil(estado.barris_total_escolhidos / 2);
    }
    parametrosValidos++;
  }

  const gas = searchParams.get('precisa_gas');
  if (gas === 'SIM' || gas === 'NAO') {
    estado.precisa_gas = gas === 'SIM';
    parametrosValidos++;
  }

  // 12. Modalidade logística
  const modalidade = searchParams.get('modalidade_logistica');
  if (modalidade === 'ENTREGA' || modalidade === 'RETIRADA_FABRICA') {
    estado.modalidade_logistica = modalidade as ModalidadeLogistica;
    estado.frete = calcularFrete(estado.modalidade_logistica, estado.cidade);
    parametrosValidos++;
  }

  // 13. Data/hora de retirada (quando retirada)
  const dataRetirada = searchParams.get('data_retirada');
  if (dataRetirada && /^\d{4}-\d{2}-\d{2}$/.test(dataRetirada)) {
    estado.data_retirada = dataRetirada;
    parametrosValidos++;
  }
  const horaRetirada = searchParams.get('hora_retirada');
  if (horaRetirada) {
    estado.hora_retirada = horaRetirada.slice(0, 10);
    parametrosValidos++;
  }

  // 14. Forma de pagamento
  const formaPagamento = searchParams.get('forma_pagamento');
  if (formaPagamento === 'PIX' || formaPagamento === 'DINHEIRO' || formaPagamento === 'CARTAO') {
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

  // 15. Posicionar usuário no primeiro ponto que ainda exige decisão humana
  // Etapas:
  // 1: Entrada
  // 2: Evento (se faltar data, adultos, duração ou outras bebidas)
  // 3: Dimensionamento / Cenários (se faltar escolher barris_total_escolhidos)
  // 4: Mix (se o mix não estiver fechado)
  // 5: Equipamentos
  // 6: Logística (se entrega e faltar endereço completo)
  // 7: Revisão pré-orçamento
  let primeiraEtapaPendente = 2; // Padrão: vai para Evento se entrar via URL
  if (!estado.data_evento || !estado.qtd_adultos || !estado.duracao_horas || !estado.outras_bebidas_alcoolicas) {
    primeiraEtapaPendente = 2;
  } else if (!estado.barris_total_escolhidos) {
    primeiraEtapaPendente = 3;
  } else if (!validarInvarianteMix(estado.mix, estado.barris_total_escolhidos).valido) {
    primeiraEtapaPendente = 4;
  } else if (!estado.endereco.logradouro && estado.modalidade_logistica === 'ENTREGA') {
    primeiraEtapaPendente = 6;
  } else {
    primeiraEtapaPendente = 7; // Revisão
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
