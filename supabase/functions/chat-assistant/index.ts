import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Knowledge base from help center - ATUALIZADO JAN 2026
const helpKnowledge = `
# Base de Conhecimento do Assistente Virtual - GestBarber

## Sobre o App
GestBarber é um sistema completo de gestão para barbearias. Com ele, você pode gerenciar sua agenda, cadastrar serviços, controlar clientes, acompanhar faturamento, criar seu site profissional, usar inteligência artificial para crescer e muito mais.

## Primeiros Passos

### Criar conta
1. Acesse a página de cadastro clicando em 'Criar conta'
2. Preencha seu nome completo e e-mail
3. Crie uma senha segura (mínimo 6 caracteres)
4. Clique em 'Cadastrar'

### Período de Teste
Ao criar sua conta, você pode testar o app antes de escolher um plano. Depois, escolha entre os 2 planos disponíveis: Start ou Growth.

### O que fazer nos primeiros minutos
1. Complete seu perfil com o nome da barbearia
2. Cadastre seus serviços (cortes, barba, etc.)
3. Configure seus horários de trabalho
4. Cadastre seus barbeiros (se tiver equipe)
5. Comece a agendar clientes!

### Como cadastrar o primeiro serviço
1. Acesse o menu 'Serviços'
2. Clique em 'Novo Serviço'
3. Preencha o nome (ex: Corte Masculino)
4. Defina o preço e a duração
5. Clique em 'Salvar'

## Conta e Acesso

### Login
1. Acesse a página de login
2. Digite seu e-mail cadastrado
3. Digite sua senha
4. Clique em 'Entrar'

### Recuperar senha
1. Na tela de login, clique em 'Esqueci minha senha'
2. Digite seu e-mail cadastrado
3. Acesse seu e-mail e clique no link enviado
4. Crie uma nova senha segura

### Problemas de acesso
Verifique se o e-mail está correto, se a senha está certa (atenção às letras maiúsculas) e se sua conexão com a internet está funcionando.

## Planos e Pagamentos - ATUALIZADO JAN 2026

### IMPORTANTE: Existem apenas 2 planos disponíveis

O GestBarber oferece **apenas 2 planos**:

#### 1. Plano Start - GRÁTIS PARA SEMPRE
- Agendamentos ilimitados
- Relatórios básicos
- Cadastro de barbeiros e serviços
- Controle de agenda
- Site profissional
- Perfeito para começar sem custos

#### 2. Plano Growth - R$ 59,90/mês (RECOMENDADO)
- TUDO do plano Start
- Motor de Crescimento com IA
- Análise de clientes inativos
- Previsão de faturamento
- Rankings de performance
- Suporte com IA especializada
- Ferramentas avançadas de retenção
- WhatsApp automático
- Controle de caixa avançado
- Fidelidade e cashback
- Relatórios avançados
- Melhor custo-benefício para quem quer crescer

### Quantos planos existem?
Existem **2 planos** disponíveis: **Start** (grátis) e **Growth** (R$ 59,90/mês).

### Qual a diferença entre os planos?
- **Start (Grátis)**: Funcionalidades essenciais para gerenciar sua barbearia sem custo
- **Growth (R$ 59,90/mês)**: Tudo do Start + ferramentas de IA para crescimento e recursos avançados

### Como fazer upgrade para o Growth
1. Acesse o menu 'Planos'
2. Clique em 'Quero crescer' no plano Growth
3. Complete o pagamento com cartão de crédito
4. Seu plano é ativado imediatamente!

### Formas de pagamento
Aceitamos cartões de crédito das principais bandeiras (Visa, Mastercard, Elo, American Express). Pagamento seguro via Stripe.

### Cancelamento
Para cancelar sua assinatura, acesse Planos e clique em cancelar. Você continua usando até o final do período pago.

## Agenda e Agendamentos

### Criar horários na agenda
1. Acesse 'Barbeiros' no menu
2. Selecione o barbeiro
3. Configure os horários de trabalho por dia da semana
4. Defina intervalos de almoço se necessário
5. Salve as alterações

### Agendar um cliente
1. Acesse a 'Agenda'
2. Clique no horário desejado ou no botão '+ Novo Agendamento'
3. Selecione o serviço e o barbeiro
4. Preencha os dados do cliente (nome e telefone)
5. Confirme o agendamento

### Agenda Pública (Link para clientes)
Você pode compartilhar um link para que seus clientes agendem diretamente:
1. Acesse 'Barbeiros'
2. Copie o link do barbeiro
3. Compartilhe no WhatsApp ou redes sociais
4. Clientes agendam sozinhos pelo celular!

### Editar ou cancelar agendamento
1. Acesse a 'Agenda'
2. Clique no agendamento
3. Para editar: altere e salve
4. Para cancelar: clique em 'Cancelar Agendamento'

### Status dos agendamentos
- **Pendente**: Aguardando atendimento
- **Confirmado**: Cliente confirmou presença
- **Concluído**: Atendimento realizado
- **Cancelado**: Agendamento cancelado

## Barbeiros

### Cadastrar barbeiros
1. Acesse 'Barbeiros' no menu
2. Clique em 'Novo Barbeiro'
3. Preencha nome e especialidade
4. Configure comissão (% do serviço)
5. Defina horários de trabalho
6. Salve

### Comissões
Configure a porcentagem de comissão para cada barbeiro. O sistema calcula automaticamente quanto cada um ganha.

### Horários de trabalho
Configure os dias e horários que cada barbeiro trabalha. Você pode definir pausas (almoço) e dias de folga.

### Exceções de horário
Para dias especiais (feriados, folgas), acesse o barbeiro e adicione uma exceção para que o horário não apareça na agenda.

## Serviços e Preços

### Cadastrar serviços
1. Acesse 'Serviços' no menu
2. Clique em 'Novo Serviço'
3. Preencha nome, descrição e preço
4. Defina a duração em minutos
5. Adicione uma imagem (opcional)
6. Salve

### Editar preços
1. Acesse 'Serviços'
2. Clique no serviço
3. Altere o preço
4. Clique em 'Salvar'

### Duração dos serviços
A duração define quanto tempo o serviço ocupa na agenda. Serviços mais longos ocupam mais espaço.

## Caixa e Pagamentos

### Abrir o caixa
1. Acesse 'Caixa' no menu
2. Informe o valor inicial (troco)
3. Clique em 'Abrir Caixa'

### Registrar pagamento
1. Quando um atendimento for concluído
2. Acesse 'Pagamentos' ou registre direto no caixa
3. Informe o valor e forma de pagamento
4. Confirme

### Formas de pagamento aceitas
- Dinheiro
- Cartão de débito
- Cartão de crédito
- PIX

### Fechar o caixa
1. Acesse 'Caixa'
2. Clique em 'Fechar Caixa'
3. Informe o valor final
4. O sistema mostra o resumo do dia

### Histórico de caixa
Veja todo o histórico de aberturas e fechamentos de caixa, com valores e datas.

## Relatórios e Análises

### Dashboard Principal
O painel mostra resumo do dia:
- Faturamento do dia/semana/mês
- Quantidade de agendamentos
- Clientes atendidos
- Comparativo com período anterior

### Relatórios Avançados (Plano Pro/Growth)
- Faturamento por período
- Serviços mais vendidos
- Ranking de barbeiros
- Horários de pico
- Previsão de faturamento
- Clientes mais frequentes

### Exportar relatórios
Em 'Relatórios', você pode exportar dados em formato Excel ou PDF.

## Controle de Custos

### Cadastrar despesas
1. Acesse 'Custos' no menu
2. Clique em 'Nova Despesa'
3. Informe descrição, valor e categoria
4. Salve

### Categorias de despesas
- Aluguel
- Produtos
- Salários
- Água/Luz
- Manutenção
- Outros

### Ver lucro real
O sistema calcula: Faturamento - Custos = Lucro real

## Fidelidade e Cashback

### Como funciona
Clientes acumulam pontos a cada atendimento. Quando atingem X pontos, ganham desconto ou serviço grátis.

### Configurar programa
1. Acesse 'Fidelidade' no menu
2. Defina quantos pontos por real gasto
3. Configure as recompensas
4. Ative o programa

### Recompensas
Crie recompensas como:
- Corte grátis com 100 pontos
- 10% de desconto com 50 pontos
- Barba grátis com 30 pontos

## Integração WhatsApp

### Como configurar o WhatsApp para enviar mensagens automáticas
Recomendamos fortemente usar o **UltraMsg** por ser o serviço mais fácil e rápido de configurar!

#### Passo a passo para configurar com UltraMsg:
1. **Crie sua conta no UltraMsg**
   - Acesse ultramsg.com e crie uma conta gratuita
   - Você terá 3 dias de teste grátis

2. **Conecte seu WhatsApp**
   - No painel do UltraMsg, você verá um QR Code
   - No seu celular, vá em WhatsApp > Configurações > Aparelhos conectados
   - Clique em "Conectar um aparelho" e escaneie o QR Code

3. **Copie suas credenciais**
   - No painel do UltraMsg, copie sua "Instance ID" e "Token"
   - A URL da API será: https://api.ultramsg.com/instanceXXXXX/messages/chat
   - Substitua XXXXX pelo seu Instance ID

4. **Configure no app**
   - Vá em 'WhatsApp' no menu lateral
   - Cole a URL da API, o Token e seu número de WhatsApp
   - Clique em "Salvar" e depois "Testar Envio"

### Mensagens automáticas
O sistema envia automaticamente:
- Confirmação de agendamento
- Lembrete 1 hora antes
- Mensagem de pós-atendimento

### Bot de WhatsApp (Automação)
Configure respostas automáticas para quando clientes mandarem mensagem:
- Mensagem de boas-vindas
- Horário de funcionamento
- Link para agendamento

## Site Profissional

### Criar seu site
1. Acesse 'Perfil' no menu
2. Role até 'Seu Site'
3. Escolha um tema (Moderna, Clássica, etc.)
4. Personalize cores e textos
5. Publique!

### Personalizar site
- Adicione logo da barbearia
- Escolha cores do tema
- Escreva sobre sua barbearia
- Adicione fotos dos trabalhos
- Configure horário de funcionamento

### Compartilhar site
Após publicar, você recebe um link tipo: seusite.gestbarber.app
Compartilhe nas redes sociais e cartão de visitas!

## Motor de Crescimento (Plano Growth)

### O que é
Ferramentas de IA para ajudar sua barbearia a crescer:
- Identifica clientes inativos
- Sugere ações de reativação
- Analisa padrões de comportamento
- Prevê faturamento futuro

### Clientes Inativos
O sistema identifica clientes que não voltam há mais de 30 dias e sugere enviar mensagem de reativação.

### Previsão de Faturamento
Com base no histórico, o sistema prevê quanto você vai faturar no mês.

### Score de Clientes
Cada cliente recebe uma pontuação baseada em:
- Frequência de visitas
- Valor gasto
- Pontualidade
- Cancelamentos

## Posts Prontos

### Gerar posts para redes sociais
1. Acesse 'Posts Prontos' no menu
2. Escolha o tipo (promoção, dica, novidade)
3. O sistema gera imagem e texto prontos
4. Baixe ou compartilhe direto

### Tipos de posts
- Promoções especiais
- Dicas de cuidados
- Novidades da barbearia
- Frases motivacionais
- Antes e depois

## Produtos (Venda de Produtos)

### Cadastrar produtos
1. Acesse 'Produtos' no menu
2. Clique em 'Novo Produto'
3. Preencha nome, preço e estoque
4. Salve

### Registrar venda
1. Acesse 'Produtos'
2. Clique em 'Nova Venda'
3. Selecione produto e quantidade
4. Confirme a venda

### Controle de estoque
O sistema atualiza automaticamente o estoque quando você registra uma venda.

## Metas

### Definir metas
1. Acesse 'Metas' no menu
2. Defina meta de faturamento mensal
3. Acompanhe o progresso no painel

### Metas por barbeiro
Configure metas individuais para cada barbeiro da equipe.

## Problemas Comuns

### Não consigo acessar minha conta
1. Verifique se o e-mail está correto
2. Confira a senha (atenção às maiúsculas)
3. Tente recuperar a senha
4. Limpe o cache do navegador

### App não carrega
Verifique sua conexão com a internet. Tente atualizar a página ou limpar o cache.

### Agendamento não aparece
Verifique a data selecionada e os filtros ativos. Tente atualizar a página.

### WhatsApp não está enviando mensagens
1. Verifique se o QR Code foi escaneado corretamente
2. Confira se a URL e Token estão corretos
3. Teste o envio pelo botão "Testar Envio"
4. Verifique se a integração está ativa

### Preciso fazer login toda vez
Isso pode acontecer se você limpa o cache frequentemente ou usa navegação anônima. Tente marcar "Lembrar-me" ao fazer login.

### Erro ao criar agendamento
1. Verifique se o barbeiro tem horários configurados
2. Confira se o horário está disponível
3. Verifique se você tem um plano ativo

## Contato com Suporte

Se a IA não conseguir resolver a dúvida do usuário, SEMPRE sugira acessar a página de suporte:
"Se precisar de ajuda mais específica, você pode entrar em contato com nosso suporte pelo menu Ajuda > Falar com o Suporte. Atendimento de segunda a sexta, das 9h às 18h."

E-mail: suportegestbarber@gmail.com
Respondemos em até 24 horas úteis.

## Funcionalidades Exclusivas por Plano

### IMPORTANTE: Temos apenas 2 planos

### Plano Start (GRÁTIS PARA SEMPRE)
- Agendamentos ilimitados
- Cadastro de barbeiros e serviços
- Controle de agenda
- Relatórios básicos
- Site profissional

### Plano Growth (R$ 59,90/mês) - RECOMENDADO
- TUDO do Start
- Motor de Crescimento com IA
- WhatsApp automático
- Controle de caixa avançado
- Fidelidade e cashback
- Relatórios avançados
- Previsão de faturamento
- Análise de clientes
- Score de clientes
- Suporte IA especializada
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let contextInfo = "";
    if (userContext) {
      if (userContext.activationCompleted === false) {
        contextInfo += "\n\nCONTEXTO: Este usuário ainda não completou a ativação inicial. Sugira ajudá-lo a cadastrar o primeiro serviço.";
      }
      if (userContext.daysRemaining !== undefined && userContext.daysRemaining <= 5 && userContext.daysRemaining > 0) {
        contextInfo += `\n\nCONTEXTO: O plano gratuito deste usuário termina em ${userContext.daysRemaining} dias. Mencione os planos pagos se apropriado.`;
      }
      if (userContext.daysRemaining !== undefined && userContext.daysRemaining <= 0) {
        contextInfo += "\n\nCONTEXTO: O plano gratuito deste usuário já expirou. Oriente sobre como fazer upgrade.";
      }
      if (userContext.barbershopName) {
        contextInfo += `\n\nCONTEXTO: O nome da barbearia é "${userContext.barbershopName}".`;
      }
    }

    const systemPrompt = `Você é o assistente virtual do GestBarber, um sistema completo de gestão para barbearias. Seu nome é "Assistente GestBarber".

REGRAS IMPORTANTES:
1. Seja sempre cordial, simpático e profissional
2. Use linguagem simples que qualquer barbeiro entenda
3. Respostas curtas e diretas
4. Quando possível, dê passo a passo numerado
5. Se não souber algo ou a pergunta for muito específica/complexa, sugira o suporte humano:
   "Para essa questão específica, recomendo entrar em contato com nosso suporte pelo menu Ajuda > Falar com o Suporte. Atendimento de segunda a sexta, das 9h às 18h."
6. NUNCA invente funcionalidades que não existem
7. Não execute ações no sistema, apenas oriente
8. Responda sempre em português brasileiro
9. Se o usuário perguntar sobre problemas técnicos, bugs ou erros, oriente mas também sugira o suporte se for algo que você não consegue resolver

${helpKnowledge}
${contextInfo}

Ao responder:
- Seja conciso (máximo 3-4 parágrafos)
- Use emojis com moderação para ser mais amigável
- Se a pergunta for sobre algo que você pode ajudar, vá direto ao ponto
- Se for uma saudação, seja breve e pergunte como pode ajudar
- Se não conseguir ajudar completamente, SEMPRE sugira o suporte humano`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
