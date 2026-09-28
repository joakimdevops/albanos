# Albano's Chopp Calculator — Cervejaria Albanos

Calculadora oficial e motor determinístico de dimensionamento, portfólio, logística e cotação de chope para eventos da **Cervejaria Albanos do Brasil** (Belo Horizonte e Nova Lima - MG).

---

## 1. Fluxo de Jornada do Usuário

O fluxo do webapp é estruturado em etapas sequenciais e determinísticas, garantindo que o lead seja devidamente identificado antes da revelação da cotação e das condições financeiras:

1. **Etapa 1 — Dados do Evento:** Data, horário de início (obrigatório), cidade, público (adultos), duração da festa em horas inteiras (1 a 12 horas) ou seleção explícita de caso especial para "Evento com mais de 12 horas ou em múltiplos dias" (sem extrapolação matemática automática de consumo, preservando dados para alinhamento com a equipe comercial), e presença de outras bebidas alcoólicas.
2. **Etapa 2 — Dimensionamento & Cenários:** Estimativa em litros com base no fator de consumo e classificação de cenários (Justo, Enxuto, Abundante) em múltiplos de barris de 50 L.
3. **Etapa 3 — Portfólio & Mix de Chope:** Alocação de estilos (Pilsen, Life Lager, Session IPA, Amber, American IPA, Pale Ale) respeitando os invariantes da quantidade total de barris.
4. **Etapa 4 — Equipamentos Solicitados:** Definição explícita da necessidade de chopeira elétrica Albanos e cilindro de gás CO2 sob semântica de solicitação ("solicitada/solicitado", com quantidade e disponibilidade a confirmar pelo time humano, sem cálculo ou recomendação automática do tipo `ceil(barris/2)`).
5. **Etapa 5 — Logística & Frete:** Escolha entre Retirada na Fábrica (**R. Rainha Elizabeth, 639 – Jardim Canadá, Nova Lima – MG, CEP 34007-790** — frete grátis) ou Entrega no local (endereço completo, agendamento de data/hora válidos e tabela de frete).
6. **Etapa 6 — Revisão Pré-Cotação (Conferência):** Revisão consolidada de todas as escolhas operacionais com atalhos de edição antes de avançar.
7. **Etapa 7 — Identificação do Lead (Pré-Cotação):** Coleta obrigatória de Nome Completo e Telefone/WhatsApp (com DDD) e E-mail opcional (com a possibilidade de envio de uma cópia da cotação por e-mail).
8. **Etapa 8 — Cotação, Pagamento & Confirmação:** Demonstração dos valores da cotação com neutralidade financeira inicial (`A_DEFINIR`, sem presunção antecipada de PIX). Seleção explícita da forma de pagamento restrita a `PIX` ou `CARTAO` (dinheiro totalmente eliminado). Desconto de 5% (barganha / cupom ALBANOS) aplicável **exclusivamente ao PIX** (sobre produtos + frete conhecido). No Cartão, multiplicadores preservados de 1x a 12x sem verbalização de índices na UI, com parcelas iniciando obrigatoriamente indefinidas (bloqueando confirmação até escolha válida). Mudanças na forma de pagamento recalculam os totais imediatamente antes da confirmação formal, preservando integralmente os dados de contato do lead.

---

## 2. Canal Operacional, Responsabilidade e Handoff WhatsApp

### 2.1 Destino Oficial do WhatsApp
O número canônico e unificado para handoff do webapp é:
- **WhatsApp Oficial Albanos:** `+55 32 8822-3023` (código de discagem: `553288223023`)
- Definido em `WHATSAPP_ALBANOS_NUMERO` (`src/businessRules/domainConfig.ts`) como fonte única da verdade para links `wa.me`.

### 2.2 Responsabilidade Operacional e Horários de Atendimento
- **Responsável Operacional:** O atendimento encaminhado pelo webapp é assumido integralmente pelo **Time Comercial Albanos**.
- **Iara (Atendimento Automatizado):** Disponível 24 horas por dia para recepção e triagem contínua.
- **Time Humano Comercial Albanos:** Segunda a sexta-feira, das 10h às 17h.
- **Independência Operacional:** O horário de atendimento humano não se confunde com:
  - Janelas de entrega e retirada logísticas (definidas nas regras logísticas do webapp);
  - Horário de realização do evento informado pelo cliente.
- O cliente pode gerar cotações e encaminhar solicitações a qualquer momento, sem bloqueios fora do horário comercial.

### 2.3 Significado Correto do Handoff ("Confirmar pedido")
O clique no botão **"Confirmar pedido"** na Etapa 8 representa:
- Aceite explícito da cotação e das condições comerciais vigentes apresentadas no webapp;
- Escolha da condição de pagamento pretendida (e parcelas no cartão);
- Intenção expressa de dar prosseguimento ao pedido com a Cervejaria Albanos;
- Direcionamento para continuidade do atendimento pelo WhatsApp com o Time Comercial.

**O clique em "Confirmar pedido" NÃO significa automaticamente:**
- Estoque reservado ou garantia antecipada de barris;
- Chopeira ou gás garantidos (são equipamentos sob solicitação e disponibilidade a confirmar);
- Rota logística definitivamente confirmada;
- Pagamento recebido ou pedido faturado;
- Mensagem efetivamente enviada no WhatsApp ou conversa humana iniciada (o envio depende da ação do cliente no WhatsApp).

### 2.4 Conteúdo Estruturado do Handoff
A mensagem pré-estruturada para o WhatsApp consolida e transmite ao Time Comercial:
- Identificação do responsável (nome completo e telefone obrigatórios; e-mail opcional);
- Data do evento, horário de início e cidade;
- Público total e número de adultos;
- Duração do evento em horas inteiras (1 a 12h) ou indicação explícita de "Evento com mais de 12h ou múltiplos dias (análise comercial)";
- Volume e barris de chope (50 L cada) e distribuição do mix de estilos;
- Necessidade de chopeira e gás sob semântica de solicitação ("solicitada / a confirmar");
- Modalidade logística (Retirada na Fábrica no endereço oficial ou Entrega com endereço completo);
- Data e horário logísticos agendados;
- Cotação de produtos, frete (ou aviso de frete a confirmar) e forma de pagamento com parcelas quando cartão;
- Aplicação de cupom/desconto exclusivamente para PIX quando aplicável;
- Frase contextual de abertura (*START*) conforme o estágio e pendências da cotação.

### 2.5 Frete A_CONFIRMAR e Condição Financeira
- Quando o frete estiver `A_CONFIRMAR`, nenhum valor final fictício ou parcial é divulgado como definitivo no WhatsApp ou no resumo.
- No Cartão com frete a confirmar, informa-se o número de parcelas escolhido e que o valor final das parcelas será recalculado sobre a base completa (produtos + frete) após a confirmação do frete.
- No PIX com desconto, o desconto de 5% sobre produtos + frete é explicitado como a ser recalculado após a validação do frete.

---

## 3. Arquitetura de Dados & Persistência: Protótipo V0 vs. Produção V1

Esta seção define formalmente as diretrizes arquiteturais para o tratamento do estado da jornada e da persistência de dados.

### Protótipo / V0 Atual
- **Mecanismo de Persistência:** Estado em memória (React State) e persistência local no navegador (`localStorage` via chave canônica).
- **Finalidade:** Agilidade de prototipação, testes automatizados, suporte a recarregamento de página sem perda de progresso durante o preenchimento e continuidade da sessão pelo próprio usuário no mesmo dispositivo.
- **Limitação Conhecida de Abandono:** Na arquitetura V0 atual, **os dados capturados na Etapa 7 (Nome, Telefone, E-mail) ficam armazenados estritamente no navegador do cliente**. Em caso de abandono da jornada antes do clique no botão "Confirmar pedido" / envio via WhatsApp, **a equipe Albanos NÃO tem acesso externo automático a esse contato**, pois não há canal ativo de transmissão (API, webhook ou banco de dados remoto) configurado nesta fase.
- **Comunicação ao Cliente:** Informação clara e objetiva de que "Seus dados estão seguros", sem descrições técnicas excessivas na interface. Promessa de envio restrita a: "Podemos enviar uma cópia da cotação por e-mail."

### Versão de Produção / V1
Para a entrada em produção (V1), **a persistência não poderá depender exclusivamente do navegador ou de localStorage**. A versão definitiva deverá integrar um **banco de dados ou serviço persistente de backend equivalente** como fonte canônica dos dados da jornada e dos pedidos.

#### Escopo Mínimo de Persistência Canônica (V1):
1. **Identificação do Lead:** Nome completo, telefone/WhatsApp, e-mail (quando informado), timestamp de captura e identificador único da sessão/lead.
2. **Dados do Evento:** Data do evento, horário de início, cidade de realização, público total, número de adultos, duração em horas e perfil de consumo (outras bebidas alcoólicas).
3. **Dimensionamento & Portfólio:** Litros calculados, cenário de barris selecionado (Justo, Enxuto, Abundante), total de barris de 50 L e distribuição do mix por estilo.
4. **Equipamentos:** Respostas sobre chopeira elétrica Albanos e cilindro de gás CO2.
5. **Modalidade e Dados Logísticos:** Modalidade (Entrega vs. Retirada na Fábrica), endereço de entrega (logradouro, número, bairro, complemento), agendamento logístico de data e horário.
6. **Cotação & Condições Comerciais:** Total bruto de produtos, subtotais por estilo, frete calculado (valor e status: `FIXADO`, `GRATIS` ou `A_CONFIRMAR`), cupom aplicado, descontos de barganha/cupom concedidos, base financeira consolidada e total geral.
7. **Condição de Pagamento:** Forma de pagamento pretendida/escolhida (`PIX`, `CARTAO`, `A_DEFINIR`), número de parcelas selecionado no cartão, valor calculado das parcelas e total correspondente.
8. **Status da Jornada e Aceite:** Etapa atual do funil, indicador de revisão confirmada, status de aceite da cotação (`PENDENTE`, `SIM`, `NAO`), histórico de alterações e status de conclusão do encaminhamento comercial.

#### Recuperação de Leads em Caso de Abandono (V1):
- A persistência remota da identificação do lead capturada na **Etapa 7** deverá ser disparada via API/serviço assíncrono no momento do avanço para a cotação.
- Caso o usuário abandone o webapp na Etapa 8 antes de abrir o WhatsApp, o registro permanecerá consultável no banco de dados / CRM para que o time comercial da Albanos possa realizar contato ativo e recuperar a oportunidade.

#### Requisitos de Segurança e Governança de Dados (V1):
A implementação de produção deverá cumprir rigorosamente as normas de segurança e privacidade:
- **Segurança Proporcional:** Comunicação exclusivamente sob HTTPS/TLS; APIs protegidas contra acessos não autorizados.
- **Controle de Acesso (RBAC):** Restrição de leitura e gestão dos leads a atendentes e operadores comerciais autorizados da Cervejaria Albanos.
- **Proteção do Armazenamento:** Dados armazenados com criptografia em repouso e sanitização prévia contra injeções.
- **Minimização de Dados:** Coleta restrita a nome, telefone e e-mail (proibida a solicitação de CPF, RG ou datas de nascimento desnecessárias).
- **Retenção e Descarte:** Políticas de expiração periódica de leads frios/descartados e atendimento a solicitações de exclusão de dados pessoais em conformidade com as boas práticas e legislação de proteção de dados (LGPD).

---

## 4. Scripts e Execução de Testes

- **Ambiente de Desenvolvimento:** `npm run dev` (porta 3000)
- **Build de Produção:** `npm run build`
- **Validação de Tipagem:** `npm run lint` (`tsc --noEmit`)
- **Execução de Todos os Testes:** `npm test`
- **Testes de Motor Determinístico:** `npm run test:engine`
- **Testes de Consistência Semântica:** `npm run test:semantic`
