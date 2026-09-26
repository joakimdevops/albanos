/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Configuração Central de Domínio (Fonte Canônica de Verdade) V1.1
 */

import { CalculatorState, EstiloChope, EstiloInfo } from '../types';

export const CONTRACT_VERSION = '1';
export const WHATSAPP_ALBANOS_NUMERO = '553288223023'; // Número comercial da Albanos
export const BARRIL_VOLUME_LITROS = 50;
export const ZONA_JUSTA_LITROS = 10;
export const ALCADA_DESCONTO_BARGANHA_PERCENTUAL = 0.05; // 5% sobre produtos em PIX/DINHEIRO

export const PORTFOLIO_ESTILOS: Record<EstiloChope, EstiloInfo> = {
  pilsen: {
    id: 'pilsen',
    nome: 'Albanos Pilsen',
    estiloTecnico: 'American Lager',
    precoUnitario: 690.0,
    abv: '4,90%',
    ibu: '12',
    descricao:
      'Cerveja leve, clara e de alta refrescância. Apresenta amargor sutil e harmonioso, sendo o perfil clássico para consumo diário',
    perfilSensorial:
      'Cerveja leve, clara e de alta refrescância. Apresenta amargor sutil e harmonioso, sendo o perfil clássico para consumo diário',
  },
  life_lager: {
    id: 'life_lager',
    nome: 'Albanos Life Lager',
    estiloTecnico: 'American Light Lager',
    precoUnitario: 850.0,
    abv: '4,60%',
    ibu: '11',
    descricao:
      'Uma versão leve focada em funcionalidade e baixas calorias sem abdicar do aroma, trazendo um toque cítrico/floral sutil com o lúpulo Cascade na receita. Zero carboidrato',
    perfilSensorial:
      'Uma versão leve focada em funcionalidade e baixas calorias sem abdicar do aroma, trazendo um toque cítrico/floral sutil com o lúpulo Cascade na receita. Zero carboidrato',
  },
  amber: {
    id: 'amber',
    nome: 'Albanos Amber Lager',
    estiloTecnico: 'American Amber Lager',
    precoUnitario: 850.0,
    abv: '4,90%',
    ibu: '12',
    descricao:
      'Cerveja de coloração ambar que equilibra o perfil límpido de fermentação Lager com notas maltadas sutis de tosta e caramelo, mantendo o amargor muito baixo e fácil de beber',
    perfilSensorial:
      'Cerveja de coloração ambar que equilibra o perfil límpido de fermentação Lager com notas maltadas sutis de tosta e caramelo, mantendo o amargor muito baixo e fácil de beber',
  },
  session_ipa: {
    id: 'session_ipa',
    nome: 'Albanos Session IPA',
    estiloTecnico: 'American Session IPA',
    precoUnitario: 850.0,
    abv: '4,00%',
    ibu: '20',
    descricao:
      'Desenvolvida para ter alta drinkability. Combina baixo teor alcoólico com um perfil aromático moderno e frutado/cítrico potente, graças à combinação de diferentes lúpulos americanos. Premiada no World Beer Award como uma das melhores do mundo.',
    perfilSensorial:
      'Desenvolvida para ter alta drinkability. Combina baixo teor alcoólico com um perfil aromático moderno e frutado/cítrico potente, graças à combinação de diferentes lúpulos americanos. Premiada no World Beer Award como uma das melhores do mundo.',
    isPremiado: true,
    destaquePremio: 'World Beer Award',
  },
  american_ipa: {
    id: 'american_ipa',
    nome: 'Albanos American IPA',
    estiloTecnico: 'American IPA',
    precoUnitario: 850.0,
    abv: '6,30%',
    ibu: '50',
    descricao:
      'IPA clássica. Apresenta amargor firme e proeminente acompanhado pelas notas cítricas e resinosas do lúpulo.',
    perfilSensorial:
      'IPA clássica. Apresenta amargor firme e proeminente acompanhado pelas notas cítricas e resinosas do lúpulo.',
  },
  pale_ale: {
    id: 'pale_ale',
    nome: 'Albanos Pale Ale',
    estiloTecnico: 'English Pale Ale',
    precoUnitario: 850.0,
    abv: '4,50%',
    ibu: '28',
    descricao:
      'Segue a tradição britânica, apresentando perfil equilibrado entre o dulçor do malte e o perfil terroso/floral do lúpulo inglês.',
    perfilSensorial:
      'Segue a tradição britânica, apresentando perfil equilibrado entre o dulçor do malte e o perfil terroso/floral do lúpulo inglês.',
  },
};

export const LISTA_ESTILOS: EstiloInfo[] = [
  PORTFOLIO_ESTILOS.pilsen,
  PORTFOLIO_ESTILOS.life_lager,
  PORTFOLIO_ESTILOS.amber,
  PORTFOLIO_ESTILOS.session_ipa,
  PORTFOLIO_ESTILOS.american_ipa,
  PORTFOLIO_ESTILOS.pale_ale,
];

// Tabela de consumo de referência por adulto (Litros/adulto)
export const TABELA_CONSUMO_INTEIRO: Record<number, { somenteChope: number; comOutraAlcoolica: number }> = {
  1: { somenteChope: 1.5, comOutraAlcoolica: 1.2 },
  2: { somenteChope: 1.5, comOutraAlcoolica: 1.2 },
  3: { somenteChope: 1.5, comOutraAlcoolica: 1.2 },
  4: { somenteChope: 1.5, comOutraAlcoolica: 1.2 },
  5: { somenteChope: 1.65, comOutraAlcoolica: 1.32 },
  6: { somenteChope: 1.8, comOutraAlcoolica: 1.44 },
  7: { somenteChope: 1.95, comOutraAlcoolica: 1.56 },
  8: { somenteChope: 2.1, comOutraAlcoolica: 1.68 },
  9: { somenteChope: 2.25, comOutraAlcoolica: 1.8 },
  10: { somenteChope: 2.4, comOutraAlcoolica: 1.92 },
  11: { somenteChope: 2.55, comOutraAlcoolica: 2.04 },
  12: { somenteChope: 2.7, comOutraAlcoolica: 2.16 },
};

// Multiplicadores internos de cartão de crédito (1x até 12x)
export const MULTIPLICADORES_CARTAO: Record<number, number> = {
  1: 1.0439,
  2: 1.065,
  3: 1.0755,
  4: 1.086,
  5: 1.0965,
  6: 1.1076,
  7: 1.1445,
  8: 1.1552,
  9: 1.1664,
  10: 1.178,
  11: 1.1891,
  12: 1.2,
};

// Cidades da Tabela de Frete Oficial
export const FRETE_BELO_HORIZONTE_VALOR = 50.0;
export const FRETE_RMBH_VALOR = 75.0;
export const FRETE_COLAR_VALOR = 100.0;

export const MUNICIPIOS_RMBH = [
  'Baldim',
  'Betim',
  'Brumadinho',
  'Caeté',
  'Capim Branco',
  'Confins',
  'Contagem',
  'Esmeraldas',
  'Florestal',
  'Ibirité',
  'Igarapé',
  'Itaguara',
  'Itatiaiuçu',
  'Jabuticatubas',
  'Juatuba',
  'Lagoa Santa',
  'Mário Campos',
  'Mateus Leme',
  'Matozinhos',
  'Nova Lima',
  'Nova União',
  'Pedro Leopoldo',
  'Raposos',
  'Ribeirão das Neves',
  'Rio Acima',
  'Rio Manso',
  'Sabará',
  'Santa Luzia',
  'São Joaquim de Bicas',
  'São José da Lapa',
  'Sarzedo',
  'Taquaraçu de Minas',
  'Vespasiano',
];

export const MUNICIPIOS_COLAR_METROPOLITANO = [
  'Barão de Cocais',
  'Belo Vale',
  'Bom Jesus do Amparo',
  'Bonfim',
  'Fortuna de Minas',
  'Funilândia',
  'Inhaúma',
  'Itabirito',
  'Itaúna',
  'Moeda',
  'Pará de Minas',
  'Prudente de Morais',
  'Santa Bárbara',
  'São Gonçalo do Rio Abaixo',
  'São José da Varginha',
  'Sete Lagoas',
];

export const ESTADO_INICIAL: CalculatorState = {
  versaoContrato: CONTRACT_VERSION,
  origem: 'direct',
  cidade: '',
  duracao_horas: 4,
  precisa_chopeira: true,
  precisa_gas: true,
  modalidade_logistica: 'ENTREGA',
  endereco: {
    cidade: '',
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
  frete: {
    valor: null,
    status: 'A_CONFIRMAR',
    faixaNome: 'A definir',
    detalhe: 'Informe a cidade para identificar o valor do frete.',
  },
  revisao_pre_orcamento_confirmada: false,
  aceite_orcamento: 'UNKNOWN',
  forma_pagamento: 'A_DEFINIR',
  parcelas_cartao: 1,
  houve_barganha: false,
  cupom_desconto: '',
  status_excecao_comercial: 'NAO_SOLICITADA',
  contato: {},
  prioridade_atendimento: 'NORMAL',
  handoff_status: 'NAO_INICIADO',
  etapaAtual: 1,
};
