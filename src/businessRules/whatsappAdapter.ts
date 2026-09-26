/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Adaptador de Handoff WhatsApp (wa.me) V1.1
 */

import { CalculatorState, HandoffTipo } from '../types';
import { WHATSAPP_ALBANOS_NUMERO } from './domainConfig';
import { formatarResumoMix } from './mixEngine';
import { formatarMoeda } from './budgetEngine';
import { formatarDataBrasileira } from './logisticsEngine';

/**
 * Gera a frase final de "START" para iniciar o diálogo no WhatsApp
 * facilitando a continuidade imediata dependendo da etapa exata onde parou.
 */
export function gerarFraseStartAtendimento(
  etapaAtual?: number,
  tipoHandoff?: HandoffTipo
): string {
  if (tipoHandoff === 'final' || etapaAtual === 8) {
    return 'Olá, equipe Albanos! Finalizei meu pedido com o orçamento acima aprovado pelo app. Como procedemos com a confirmação da data e o pagamento?';
  }

  switch (etapaAtual) {
    case 1:
      return 'Olá, equipe Albanos! Comecei o planejamento do meu evento (data e local acima). Podem me ajudar a dimensionar a quantidade ideal de chopp?';
    case 2:
      return 'Olá, equipe Albanos! Já informei o público e a duração do meu evento. Podem validar se essa quantidade de chopp é a ideal para a minha festa?';
    case 3:
      return 'Olá, equipe Albanos! Já defini a quantidade de barris e gostaria de uma sugestão do mestre cervejeiro para o mix de estilos ideal para os meus convidados.';
    case 4:
      return 'Olá, equipe Albanos! Tenho dúvidas sobre a chopeira e a instalação no local do evento. Como funciona a entrega e montagem?';
    case 5:
      return 'Olá, equipe Albanos! Estava informando o local de entrega. Gostaria de confirmar a disponibilidade de rota e horários para a minha data.';
    case 6:
      return 'Olá, equipe Albanos! Revisei as informações do meu evento e gostaria de tirar algumas dúvidas antes de fechar o orçamento oficial.';
    case 7:
      return 'Olá, equipe Albanos! Já visualizei o orçamento acima no app. Gostaria de tirar dúvidas sobre as formas de pagamento e confirmar a reserva dos meus barris.';
    case 0:
    default:
      return 'Olá, equipe Albanos! Gostaria de ajuda de um consultor para planejar o chopp para o meu evento.';
  }
}

/**
 * Monta a mensagem enxuta e objetiva para o WhatsApp, reunindo apenas
 * os dados já fornecidos pelo usuário e finalizando com a pergunta de partida ideal.
 */
export function gerarTextoMensagemWhatsApp(
  estado: CalculatorState,
  tipoHandoff: HandoffTipo,
  etapaAtual?: number,
  nomeEtapa?: string
): string {
  const linhas: string[] = [];

  // Cabeçalho Enxuto
  if (tipoHandoff === 'final' || etapaAtual === 8) {
    linhas.push(`🍻 *Cervejaria Albanos • Pedido Finalizado no App*`);
  } else {
    linhas.push(`🍻 *Cervejaria Albanos • Atendimento Calculadora*`);
    if (etapaAtual !== undefined && etapaAtual > 0) {
      const etapaRotulo = nomeEtapa ? ` (${nomeEtapa})` : '';
      linhas.push(`📍 *Ponto de partida:* Etapa ${etapaAtual}/8${etapaRotulo}`);
    }
  }

  // Data e Localidade
  if (estado.data_evento) {
    const [ano, mes, dia] = estado.data_evento.split('-');
    const horaStr = estado.horario_inicio_evento ? ` às ${estado.horario_inicio_evento}` : '';
    const cidadeStr = estado.cidade ? ` • ${estado.cidade}` : '';
    linhas.push(`📅 *Evento:* ${dia}/${mes}/${ano}${horaStr}${cidadeStr}`);
  } else if (estado.cidade) {
    linhas.push(`📍 *Cidade:* ${estado.cidade}`);
  }

  // Convidados e Duração
  const pessoas = estado.qtd_pessoas || estado.qtd_adultos || 0;
  const adultos = estado.qtd_adultos || 0;
  if (pessoas > 0 || adultos > 0) {
    const duracao = estado.duracao_horas ? ` • ${estado.duracao_horas}h de festa` : '';
    const outrasBebidas = estado.outras_bebidas_alcoolicas === 'SIM' ? ' (com outras bebidas)' : '';
    linhas.push(`👥 *Convidados:* ${pessoas} pessoas (${adultos} adultos)${duracao}${outrasBebidas}`);
  }

  // Volume e Chope
  if (estado.barris_total_escolhidos && estado.barris_total_escolhidos > 0) {
    const litros = estado.barris_total_escolhidos * 50;
    const temMix = estado.mix && Object.values(estado.mix).some((v) => (v || 0) > 0);
    const mixStr = temMix ? formatarResumoMix(estado.mix) : 'estilos a definir';
    linhas.push(`🍺 *Chopp:* ${estado.barris_total_escolhidos} ${estado.barris_total_escolhidos === 1 ? 'barril' : 'barris'} (${litros} L) • ${mixStr}`);
  } else if (estado.litros_estimados && estado.litros_estimados > 0) {
    linhas.push(`🎯 *Estimativa:* ${estado.litros_estimados} L sugeridos`);
  }

  // Equipamentos (Chopeira e Gás)
  if (
    estado.precisa_chopeira !== undefined &&
    estado.barris_total_escolhidos &&
    estado.barris_total_escolhidos > 0
  ) {
    const chopStr = estado.precisa_chopeira
      ? 'Elétrica Albanos inclusa'
      : 'Própria do cliente';
    linhas.push(`⚡ *Chopeira:* ${chopStr}`);
  }

  // Logística (Retirada ou Entrega)
  if (estado.modalidade_logistica === 'RETIRADA_FABRICA') {
    const dataRet = estado.data_retirada ? formatarDataBrasileira(estado.data_retirada) : '';
    const horaRet = estado.hora_retirada ? ` às ${estado.hora_retirada}` : '';
    const agendamento = dataRet ? ` (${dataRet}${horaRet})` : '';
    linhas.push(`🚚 *Logística:* Retirada na Fábrica${agendamento} • Frete Grátis`);
  } else if (estado.endereco && estado.endereco.logradouro) {
    const bairro = estado.endereco.bairro ? ` - ${estado.endereco.bairro}` : '';
    const compl =
      estado.endereco.complemento && estado.endereco.complemento !== 'SEM_COMPLEMENTO'
        ? ` (${estado.endereco.complemento})`
        : '';
    const freteTxt =
      estado.frete.status === 'FIXADO' && estado.frete.valor !== null
        ? formatarMoeda(estado.frete.valor)
        : 'a confirmar';
    linhas.push(`🚚 *Entrega:* ${estado.endereco.logradouro}, ${estado.endereco.numero || 's/n'}${bairro}${compl} • Frete: ${freteTxt}`);
  }

  // Orçamento Consolidado
  if (estado.orcamento && estado.orcamento.invariantesValidos) {
    const desc = estado.orcamento.descontoAplicado ? ` (com 5% off)` : '';
    const condPagto =
      estado.forma_pagamento && estado.forma_pagamento !== 'A_DEFINIR'
        ? ` • ${estado.forma_pagamento}`
        : '';
    linhas.push(`💰 *Orçamento:* ${estado.orcamento.totalGeralFormatado}${desc}${condPagto}`);
  }

  // Dados de Contato
  if (estado.contato && (estado.contato.nome_completo || estado.contato.telefone_responsavel)) {
    const nome = estado.contato.nome_completo ? estado.contato.nome_completo.trim() : '';
    const tel = estado.contato.telefone_responsavel ? estado.contato.telefone_responsavel.trim() : '';
    const partes = [nome, tel].filter(Boolean);
    if (partes.length > 0) {
      linhas.push(`👤 *Responsável:* ${partes.join(' • ')}`);
    }
  }

  // Pergunta / Frase de START contextual para continuidade
  linhas.push(``);
  linhas.push(gerarFraseStartAtendimento(etapaAtual, tipoHandoff));

  return linhas.join('\n');
}

/**
 * Gera o link wa.me pronto para clique.
 */
export function gerarLinkWhatsApp(
  estado: CalculatorState,
  tipoHandoff: HandoffTipo,
  numeroCustomizado?: string,
  etapaAtual?: number,
  nomeEtapa?: string
): string {
  const numero = numeroCustomizado || WHATSAPP_ALBANOS_NUMERO;
  const texto = gerarTextoMensagemWhatsApp(estado, tipoHandoff, etapaAtual, nomeEtapa);
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
