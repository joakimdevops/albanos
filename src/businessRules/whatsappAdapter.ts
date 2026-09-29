/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Albano's Chopp Calculator — Adaptador de Handoff WhatsApp (wa.me) V1.2
 *
 * Princípios de Semântica Comercial (Rodada 6.3):
 * - Handoff Preventivo: Ocorre em qualquer etapa (inclusive Etapa 8) para dúvidas/suporte; NUNCA significa aceite.
 * - Handoff Final: Exclusivo de quando houve clique deliberado em "Confirmar Pedido" E aceite_orcamento === 'SIM'.
 * - Evento especial (>12h ou múltiplos dias) NUNCA gera cotação confirmada.
 * - Não faz promessas de "conversa iniciada", "mensagem enviada", "reserva automática" ou "continuidade imediata".
 * - Atendimento: Time Comercial Albanos (seg–sex, 10h–17h; Iara 24h). Logística apenas para rota/entrega/retirada.
 */

import { CalculatorState, HandoffTipo } from '../types';
import { WHATSAPP_ALBANOS_NUMERO } from './domainConfig';
import { formatarResumoMix } from './mixEngine';
import { formatarMoeda } from './budgetEngine';
import { formatarDataBrasileira } from './logisticsEngine';

/**
 * Gera a frase final de "START" para iniciar o diálogo no WhatsApp
 * com semântica precisa dependendo do tipo de handoff e da etapa atual.
 */
export function gerarFraseStartAtendimento(
  etapaAtual?: number,
  tipoHandoff?: HandoffTipo,
  estado?: CalculatorState
): string {
  // CRITÉRIO CANÔNICO (6.3.1): Handoff final SÓ ocorre com tipo 'final', aceite formal 'SIM' e sem evento especial
  const ehFinal =
    tipoHandoff === 'final' &&
    estado?.aceite_orcamento === 'SIM' &&
    !estado?.evento_longo_ou_multiplos_dias;

  if (ehFinal) {
    if (estado?.frete?.status === 'A_CONFIRMAR') {
      return 'Olá, equipe Albanos! Confirmei minha cotação no aplicativo com frete a confirmar e gostaria de seguir o atendimento com o Time Comercial para verificar a disponibilidade e o valor do frete.';
    }
    return 'Olá, equipe Albanos! Confirmei minha cotação no aplicativo e gostaria de seguir o atendimento com o Time Comercial pelo WhatsApp. Gostaria de verificar a disponibilidade e os próximos passos.';
  }

  // HANDOFF PREVENTIVO (em qualquer etapa, inclusive Etapa 8 sem confirmação formal)
  switch (etapaAtual) {
    case 1:
      return 'Olá, equipe Albanos! Comecei o planejamento do meu evento (data e local acima). Podem me ajudar a dimensionar a quantidade recomendada de chopp?';
    case 2:
      if (estado?.evento_longo_ou_multiplos_dias) {
        return 'Olá, equipe Albanos! Meu evento terá mais de 12 horas ou múltiplos dias. Gostaria de um dimensionamento personalizado do Time Comercial para planejar o chopp ideal.';
      }
      return 'Olá, equipe Albanos! Já informei o público e a duração do meu evento. Gostaria de tirar dúvidas com o Time Comercial sobre a recomendação de chopp.';
    case 3:
      return 'Olá, equipe Albanos! Já defini a quantidade de barris e gostaria de uma sugestão do Time Comercial para o mix de estilos ideal para os meus convidados.';
    case 4:
      return 'Olá, equipe Albanos! Tenho dúvidas sobre os equipamentos solicitados. Como funciona a entrega e as condições de uso da chopeira?';
    case 5:
      return 'Olá, equipe Albanos! Estava informando os detalhes de logística. Gostaria de confirmar com o Time Comercial a disponibilidade de rota e horários para a minha data.';
    case 6:
      return 'Olá, equipe Albanos! Revisei as informações do meu evento e gostaria de tirar algumas dúvidas com o Time Comercial antes de gerar a cotação.';
    case 7:
      return 'Olá, equipe Albanos! Estava preenchendo meus dados de contato e gostaria de ajuda do Time Comercial para avançar.';
    case 8:
      return 'Olá, equipe Albanos! Já visualizei a cotação no aplicativo, mas ainda não confirmei. Gostaria de tirar dúvidas com o Time Comercial sobre as condições e formas de pagamento.';
    case 0:
    default:
      return 'Olá, equipe Albanos! Gostaria de ajuda do Time Comercial para planejar o chopp para o meu evento.';
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

  // CRITÉRIO CANÔNICO (6.3.1): Handoff final exige formalmente tipoHandoff === 'final' e aceite_orcamento === 'SIM'
  const ehFinal =
    tipoHandoff === 'final' &&
    estado.aceite_orcamento === 'SIM' &&
    !estado.evento_longo_ou_multiplos_dias;

  // Cabeçalho Enxuto
  if (ehFinal) {
    linhas.push(`🍻 *Cervejaria Albanos • Cotação Confirmada pelo Cliente*`);
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
    let duracao = '';
    if (estado.evento_longo_ou_multiplos_dias) {
      duracao = ' • Evento com mais de 12h ou múltiplos dias (análise comercial)';
    } else if (estado.duracao_horas) {
      duracao = ` • ${estado.duracao_horas}h de festa`;
    }
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
    typeof estado.precisa_chopeira === 'boolean' &&
    estado.barris_total_escolhidos &&
    estado.barris_total_escolhidos > 0
  ) {
    const chopStr = estado.precisa_chopeira
      ? 'Chopeira Albanos solicitada (disponibilidade a confirmar)'
      : 'Chopeira própria do cliente';
    const gasStr = typeof estado.precisa_gas === 'boolean'
      ? (estado.precisa_gas ? ' • Gás CO2 solicitado (disponibilidade a confirmar)' : ' • Gás próprio')
      : '';
    linhas.push(`⚡ *Equipamentos:* ${chopStr}${gasStr}`);
  }

  // Logística (Retirada ou Entrega)
  if (estado.modalidade_logistica === 'RETIRADA_FABRICA') {
    const dataRet = estado.data_retirada ? formatarDataBrasileira(estado.data_retirada) : '';
    const horaRet = estado.hora_retirada ? ` às ${estado.hora_retirada}` : '';
    const agendamento = dataRet ? ` (${dataRet}${horaRet})` : '';
    linhas.push(`🚚 *Logística:* Retirada na Fábrica (R. Rainha Elizabeth, 639 – Jardim Canadá, Nova Lima – MG, CEP 34007-790)${agendamento} • Frete Grátis`);
  } else if (estado.modalidade_logistica === 'ENTREGA') {
    const dataEnt = estado.data_entrega ? formatarDataBrasileira(estado.data_entrega) : '';
    const horaEnt = estado.hora_entrega ? ` às ${estado.hora_entrega}` : '';
    const agendamento = dataEnt ? ` (${dataEnt}${horaEnt})` : '';

    if (estado.endereco && estado.endereco.logradouro) {
      const bairro = estado.endereco.bairro ? ` - ${estado.endereco.bairro}` : '';
      const compl =
        estado.endereco.complemento && estado.endereco.complemento !== 'SEM_COMPLEMENTO'
          ? ` (${estado.endereco.complemento})`
          : '';
      const freteTxt =
        estado.frete.status === 'FIXADO' && estado.frete.valor !== null
          ? formatarMoeda(estado.frete.valor)
          : 'a confirmar';
      linhas.push(`🚚 *Entrega:* ${estado.endereco.logradouro}, ${estado.endereco.numero || 's/n'}${bairro}${compl}${agendamento} • Frete: ${freteTxt}`);
    } else {
      linhas.push(`🚚 *Entrega:* No local do evento${agendamento} (endereço a definir)`);
    }
  } else {
    linhas.push(`🚚 *Logística:* A definir (Entrega no local ou Retirada na fábrica)`);
  }

  // Cotação Consolidada
  if (estado.orcamento && estado.orcamento.invariantesValidos) {
    const freteConhecido =
      estado.frete &&
      estado.frete.status !== 'A_CONFIRMAR' &&
      estado.frete.valor !== null;

    if (freteConhecido) {
      const desc = estado.orcamento.descontoAplicado ? ` (com 5% off)` : '';
      let condPagto = '';
      if (estado.forma_pagamento && estado.forma_pagamento !== 'A_DEFINIR') {
        if (
          estado.forma_pagamento === 'CARTAO' &&
          estado.orcamento.valorParcelaCartao &&
          estado.orcamento.parcelasCartao
        ) {
          condPagto = ` • Cartão (${estado.orcamento.parcelasCartao}x de ${formatarMoeda(estado.orcamento.valorParcelaCartao)})`;
        } else {
          condPagto = ` • ${estado.forma_pagamento}`;
        }
      }
      linhas.push(`💰 *Cotação:* ${estado.orcamento.totalGeralFormatado}${desc}${condPagto}`);
    } else {
      // Frete A_CONFIRMAR: não publicar total fechado nem parcelas/descontos parciais como se fossem definitivos
      const prodTxt = formatarMoeda(estado.orcamento.totalProdutosBruto);
      linhas.push(`💰 *Cotação:* Produtos: ${prodTxt} + Frete a confirmar (total final a definir pelo Time Comercial Albanos)`);

      const parcelas = estado.orcamento.parcelasCartao || estado.parcelas_cartao;
      const temDesconto =
        estado.orcamento.descontoAplicado ||
        estado.houve_barganha ||
        estado.cupom_desconto === 'ALBANOS';

      if (estado.forma_pagamento === 'CARTAO') {
        const parcTxt = parcelas ? ` em ${parcelas}x` : '';
        linhas.push(`💳 *Condição:* Cartão${parcTxt} — total e parcelas serão recalculados sobre produtos + frete após a confirmação do frete`);
      } else if (estado.forma_pagamento === 'PIX' && temDesconto) {
        linhas.push(`💳 *Condição:* Pix com 5% de desconto — desconto final será aplicado sobre o total do pedido (produtos + frete) após a confirmação do frete`);
      } else if (estado.forma_pagamento && estado.forma_pagamento !== 'A_DEFINIR') {
        linhas.push(`💳 *Condição:* ${estado.forma_pagamento} — total final será fechado após a confirmação do frete`);
      }
    }
  }

  // Dados de Contato
  if (estado.contato && (estado.contato.nome_completo || estado.contato.telefone_responsavel)) {
    const nome = estado.contato.nome_completo ? estado.contato.nome_completo.trim() : '';
    const tel = estado.contato.telefone_responsavel ? estado.contato.telefone_responsavel.trim() : '';
    const email = estado.contato.email && estado.contato.email.trim() ? estado.contato.email.trim() : '';
    const partes = [nome, tel, email].filter(Boolean);
    if (partes.length > 0) {
      linhas.push(`👤 *Responsável:* ${partes.join(' • ')}`);
    }
  }

  // Pergunta / Frase de START contextual para continuidade
  linhas.push(``);
  linhas.push(gerarFraseStartAtendimento(etapaAtual, tipoHandoff, estado));

  return linhas.join('\n');
}

/**
 * Gera o link wa.me pronto para clique garantindo o número canônico da Albanos.
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
