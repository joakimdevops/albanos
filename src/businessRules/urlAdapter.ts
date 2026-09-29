/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Adaptador de URL (Iara -> Calculator) V1.2
 *
 * Princípio:
 * O deep-link pode pré-preencher dados declarados, mas não pode burlar regras, gates ou
 * atos explícitos de deliberação do usuário.
 */

import {
  CalculatorState,
  CenarioQuantidade,
  FormaPagamento,
  ModalidadeLogistica,
  OutrasBebidas,
} from '../types';
import { CONTRACT_VERSION, ESTADO_INICIAL } from './domainConfig';
import { calcularPrioridade } from './dependenciesEngine';
import { calcularDimensionamento } from './dimensioningEngine';
import { calcularFrete } from './freightEngine';
import { validarInvarianteMix } from './mixEngine';
import {
  validarDataLogistica,
  validarHorarioLogistica,
} from './logisticsEngine';
import {
  parsearInteiroEstrito,
  validarBarrisTotal,
  validarDataEvento,
  validarDuracaoHoras,
  validarEmailLead,
  validarHorarioValido,
  validarInteiroNaoNegativoEstrito,
  validarInteiroPositivoEstrito,
  validarNomeLead,
  validarParcelasCartao,
  validarQtdAdultos,
  validarQtdPessoas,
  validarTelefoneLead,
} from './validators';
import { determinarEtapaPorGates } from './gatesEngine';

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
 * Rejeita explicitamente CPF, nascimento, PII, valores derivados, aceite e confirmação de revisão.
 */
export function importarParametrosURL(
  searchParams: URLSearchParams,
  estadoBase?: CalculatorState
): URLImportResultado {
  let estado = estadoBase ? { ...estadoBase } : criarEstadoInicial();
  let parametrosValidos = 0;
  let parametrosIgnorados = 0;
  const detalhes: string[] = [];

  // 1. Origem permitida
  const src = searchParams.get('src');
  if (src === 'iara') {
    estado.origem = 'iara';
    parametrosValidos++;
  } else if (src === 'internal_team') {
    estado.origem = 'internal_team';
    parametrosValidos++;
  }

  // 2. Parâmetros explicitamente proibidos (PII, derivados, atos explícitos de revisão e aceite)
  const camposProibidos = [
    'cpf',
    'data_nascimento',
    'nascimento',
    'litros_estimados',
    'total',
    'subtotal',
    'frete',
    'aceite_orcamento',
    'revisao_pre_orcamento_confirmada',
  ];
  for (const proibido of camposProibidos) {
    if (searchParams.has(proibido)) {
      parametrosIgnorados++;
      detalhes.push(`Parâmetro proibido/derivado '${proibido}' rejeitado por segurança e governança.`);
    }
  }

  // 6.2.6 & 6.2.7: Revisão e Aceite NUNCA podem ser fabricados por URL
  estado.revisao_pre_orcamento_confirmada = false;
  estado.aceite_orcamento = 'PENDENTE';

  // 3. Data do evento (deve ser data real válida e não no passado)
  const dataEvento = searchParams.get('data_evento');
  if (dataEvento !== null) {
    if (validarDataEvento(dataEvento)) {
      estado.data_evento = dataEvento.trim();
      const { prioridade, diasAteEvento } = calcularPrioridade(estado.data_evento);
      estado.prioridade_atendimento = prioridade;
      estado.dias_ate_evento = diasAteEvento;
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Data do evento inválida ou no passado ignorada.');
    }
  }

  // 3.1 Horário de início do evento (formato canônico HH:mm real)
  const horarioInicio = searchParams.get('horario_inicio_evento');
  if (horarioInicio !== null) {
    if (validarHorarioValido(horarioInicio)) {
      estado.horario_inicio_evento = horarioInicio.trim();
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Horário de início inválido ignorado (esperado formato HH:mm válido).');
    }
  }

  // 4. Cidade
  const cidade = searchParams.get('cidade');
  if (cidade !== null) {
    const limpo = cidade.trim();
    if (limpo.length >= 2 && limpo.length <= 100) {
      estado.cidade = limpo;
      estado.endereco.cidade = limpo;
      estado.frete = calcularFrete(estado.modalidade_logistica, estado.cidade);
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Cidade informada é inválida.');
    }
  }

  // 5. Total de pessoas e adultos (inteiros estritos, sem coerção silenciosa)
  const qtdPessoas = searchParams.get('qtd_pessoas');
  if (qtdPessoas !== null) {
    if (validarInteiroPositivoEstrito(qtdPessoas)) {
      estado.qtd_pessoas = parsearInteiroEstrito(qtdPessoas)!;
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Quantidade total de pessoas deve ser um inteiro >= 1.');
    }
  }

  const qtdAdultos = searchParams.get('qtd_adultos');
  if (qtdAdultos !== null) {
    if (validarQtdAdultos(qtdAdultos)) {
      estado.qtd_adultos = parsearInteiroEstrito(qtdAdultos)!;
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Quantidade de adultos deve ser um inteiro >= 1.');
    }
  }

  // Se ambos foram informados, garante que total de pessoas >= adultos
  if (estado.qtd_pessoas && estado.qtd_adultos && estado.qtd_pessoas < estado.qtd_adultos) {
    estado.qtd_pessoas = undefined;
    parametrosIgnorados++;
    detalhes.push('Quantidade total de pessoas menor que adultos foi desconsiderada.');
  }

  // 6. Duração em horas (inteiro estrito de 1 a 12, sem arredondar ou truncar 4.5/4.9)
  const duracao = searchParams.get('duracao_horas');
  if (duracao !== null) {
    if (validarDuracaoHoras(duracao)) {
      estado.duracao_horas = parsearInteiroEstrito(duracao)!;
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Duração deve ser um número inteiro de 1 a 12 horas.');
    }
  }

  // 6.1 Evento longo (> 12h ou múltiplos dias)
  const eventoLongo =
    searchParams.get('evento_longo') ||
    searchParams.get('evento_longo_ou_multiplos_dias');
  if (eventoLongo === 'true' || eventoLongo === 'SIM' || eventoLongo === '1') {
    estado.evento_longo_ou_multiplos_dias = true;
    estado.duracao_horas = undefined; // Exclusividade mútua: remove duração normal
    estado.litros_estimados = undefined;
    estado.fator_consumo_usado = undefined;
    estado.barris_total_escolhidos = undefined;
    estado.cenario_quantidade = undefined;
    estado.orcamento = undefined;
    parametrosValidos++;
  }

  // 7. Outras bebidas alcoólicas (SIM | NAO)
  const outrasBebidas = searchParams.get('outras_bebidas_alcoolicas');
  if (outrasBebidas === 'SIM' || outrasBebidas === 'NAO') {
    estado.outras_bebidas_alcoolicas = outrasBebidas as OutrasBebidas;
    parametrosValidos++;
  } else if (outrasBebidas !== null) {
    parametrosIgnorados++;
    detalhes.push("Opção de outras bebidas alcoólicas deve ser 'SIM' ou 'NAO'.");
  }

  // Se tiver adultos, duração e outras bebidas -> recalcula litros_estimados localmente (apenas para evento normal!)
  if (!estado.evento_longo_ou_multiplos_dias && estado.qtd_adultos && estado.duracao_horas && estado.outras_bebidas_alcoolicas) {
    try {
      const dim = calcularDimensionamento(
        estado.qtd_adultos,
        estado.duracao_horas,
        estado.outras_bebidas_alcoolicas
      );
      estado.litros_estimados = dim.litrosEstimados;
      estado.fator_consumo_usado = dim.fatorConsumo;
    } catch {
      // Ignora erro silenciosamente
    }
  }

  // 8. Barris total escolhidos (inteiro estrito >= 1)
  const barrisTotal = searchParams.get('barris_total_escolhidos');
  if (barrisTotal !== null) {
    if (validarBarrisTotal(barrisTotal)) {
      estado.barris_total_escolhidos = parsearInteiroEstrito(barrisTotal)!;
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Quantidade de barris deve ser um inteiro >= 1.');
    }
  }

  // 9. Cenário de quantidade
  const cenario = searchParams.get('cenario_quantidade');
  if (cenario === 'JUSTO' || cenario === 'ENXUTO' || cenario === 'ABUNDANTE') {
    estado.cenario_quantidade = cenario as CenarioQuantidade;
    parametrosValidos++;
  } else if (cenario !== null) {
    parametrosIgnorados++;
    detalhes.push('Cenário de quantidade inválido.');
  }

  // 10. Mix por estilo (só aceito se todos forem inteiros estritos >= 0 e fecharem a invariante com barrisTotal)
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
    const parseOuZeroEstrito = (val: string | null): number | null => {
      if (val === null) return 0;
      if (!validarInteiroNaoNegativoEstrito(val)) return null;
      return parsearInteiroEstrito(val);
    };

    const p = parseOuZeroEstrito(pilsen);
    const s = parseOuZeroEstrito(session);
    const a = parseOuZeroEstrito(amber);
    const l = parseOuZeroEstrito(life);
    const am = parseOuZeroEstrito(american);
    const pa = parseOuZeroEstrito(pale);

    if (
      p !== null &&
      s !== null &&
      a !== null &&
      l !== null &&
      am !== null &&
      pa !== null
    ) {
      const novoMix = {
        pilsen: p,
        session_ipa: s,
        amber: a,
        life_lager: l,
        american_ipa: am,
        pale_ale: pa,
      };

      if (estado.barris_total_escolhidos) {
        const validacao = validarInvarianteMix(novoMix, estado.barris_total_escolhidos);
        if (validacao.valido) {
          estado.mix = novoMix;
          parametrosValidos++;
        } else {
          parametrosIgnorados++;
          detalhes.push('Mix recebido por URL não fecha com barris_total_escolhidos.');
        }
      }
    } else {
      parametrosIgnorados++;
      detalhes.push('Valores de barris no mix devem ser números inteiros não-negativos estritos.');
    }
  }

  // 11. Equipamentos (SIM | NAO | true | false)
  const chopeira = searchParams.get('precisa_chopeira');
  if (chopeira === 'SIM' || chopeira === 'NAO' || chopeira === 'true' || chopeira === 'false') {
    estado.precisa_chopeira = chopeira === 'SIM' || chopeira === 'true';
    parametrosValidos++;
  } else if (chopeira !== null) {
    parametrosIgnorados++;
    detalhes.push('Opção de chopeira inválida ignorada.');
  }

  const gas = searchParams.get('precisa_gas');
  if (gas === 'SIM' || gas === 'NAO' || gas === 'true' || gas === 'false') {
    estado.precisa_gas = gas === 'SIM' || gas === 'true';
    parametrosValidos++;
  } else if (gas !== null) {
    parametrosIgnorados++;
    detalhes.push('Opção de gás CO2 inválida ignorada.');
  }

  // 12. Modalidade logística
  const modalidade = searchParams.get('modalidade_logistica');
  if (modalidade === 'ENTREGA' || modalidade === 'RETIRADA_FABRICA' || modalidade === 'A_DEFINIR') {
    estado.modalidade_logistica = modalidade as ModalidadeLogistica;
    estado.frete = calcularFrete(estado.modalidade_logistica, estado.cidade);
    parametrosValidos++;
  } else if (modalidade !== null) {
    parametrosIgnorados++;
    detalhes.push('Modalidade logística inválida ignorada.');
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

  // 13. Data e hora de entrega (validação de domínio estrita)
  const dataEntrega = searchParams.get('data_entrega');
  if (dataEntrega !== null) {
    const valData = validarDataLogistica(dataEntrega, estado.data_evento, undefined, 'entrega');
    if (valData.valido) {
      estado.data_entrega = dataEntrega.trim();
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push(`Data de entrega inválida na URL: ${valData.motivo}`);
    }
  }

  const horaEntrega = searchParams.get('hora_entrega');
  if (horaEntrega !== null) {
    const valHora = validarHorarioLogistica(
      horaEntrega,
      estado.data_entrega,
      estado.data_evento,
      estado.horario_inicio_evento,
      'entrega'
    );
    if (valHora.valido) {
      estado.hora_entrega = horaEntrega.trim();
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push(`Horário de entrega inválido na URL: ${valHora.motivo}`);
    }
  }

  // 14. Data e hora de retirada na fábrica (validação de domínio estrita)
  const dataRetirada = searchParams.get('data_retirada');
  if (dataRetirada !== null) {
    const valData = validarDataLogistica(dataRetirada, estado.data_evento, undefined, 'retirada');
    if (valData.valido) {
      estado.data_retirada = dataRetirada.trim();
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push(`Data de retirada inválida na URL: ${valData.motivo}`);
    }
  }

  const horaRetirada = searchParams.get('hora_retirada');
  if (horaRetirada !== null) {
    const valHora = validarHorarioLogistica(
      horaRetirada,
      estado.data_retirada,
      estado.data_evento,
      estado.horario_inicio_evento,
      'retirada'
    );
    if (valHora.valido) {
      estado.hora_retirada = horaRetirada.trim();
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push(`Horário de retirada inválido na URL: ${valHora.motivo}`);
    }
  }

  // 15. Forma de pagamento (somente PIX ou CARTAO, sem DINHEIRO)
  const formaPagamento = searchParams.get('forma_pagamento');
  if (formaPagamento === 'PIX' || formaPagamento === 'CARTAO') {
    estado.forma_pagamento = formaPagamento as FormaPagamento;
    parametrosValidos++;
  } else if (formaPagamento !== null) {
    parametrosIgnorados++;
    detalhes.push('Forma de pagamento não suportada ignorada.');
  }

  // 15.1 Parcelas cartão (inteiro estrito 1..12, sem coerção float/floor)
  const parcelas = searchParams.get('parcelas_cartao');
  if (parcelas !== null) {
    if (validarParcelasCartao(parcelas)) {
      estado.parcelas_cartao = parsearInteiroEstrito(parcelas)!;
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Parcelas do cartão deve ser um número inteiro de 1 a 12.');
    }
  }

  // 16. Contato (Identificação do Lead: mesmas regras canônicas da UI)
  const nomeContato = searchParams.get('nome_completo') || searchParams.get('nome');
  if (nomeContato !== null) {
    if (validarNomeLead(nomeContato)) {
      estado.contato = {
        ...estado.contato,
        nome_completo: nomeContato.trim(),
      };
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Nome do responsável inválido (mínimo de 3 caracteres válidos).');
    }
  }

  const telContato = searchParams.get('telefone_responsavel') || searchParams.get('telefone');
  if (telContato !== null) {
    if (validarTelefoneLead(telContato)) {
      estado.contato = {
        ...estado.contato,
        telefone_responsavel: telContato.trim(),
      };
      parametrosValidos++;
    } else {
      parametrosIgnorados++;
      detalhes.push('Telefone inválido (deve conter 10 ou 11 dígitos com DDD).');
    }
  }

  const emailContato = searchParams.get('email');
  if (emailContato !== null) {
    if (validarEmailLead(emailContato) && emailContato.trim().length > 0) {
      estado.contato = {
        ...estado.contato,
        email: emailContato.trim(),
      };
      parametrosValidos++;
    } else if (emailContato.trim().length > 0) {
      parametrosIgnorados++;
      detalhes.push('E-mail em formato inválido ignorado na URL.');
    }
  }

  // 17. Determinação canônica e estrita da primeira etapa pendente (Gates 1 a 8)
  const primeiraEtapaPendente = determinarEtapaPorGates(estado);
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

export { determinarEtapaPorGates };
