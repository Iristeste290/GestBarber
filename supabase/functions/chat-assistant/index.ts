import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Knowledge base from help center
const helpKnowledge = `
# Base de Conhecimento do Assistente Virtual - GestBarber

## Sobre o App
GestBarber é um sistema completo de gestão para barbearias. Com ele, você pode gerenciar sua agenda, cadastrar serviços, controlar clientes, acompanhar faturamento e muito mais.

## Primeiros Passos

### Criar conta
1. Acesse a página de cadastro clicando em 'Criar conta'
2. Preencha seu nome completo e e-mail
3. Crie uma senha segura (mínimo 6 caracteres)
4. Clique em 'Cadastrar'

### Plano Free (30 dias)
O plano Free dá acesso a todas as funcionalidades por 30 dias, sem custo. Após os 30 dias, você pode fazer upgrade para continuar usando.

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

### Por que não consigo criar mais de uma conta gratuita
Para garantir acesso justo ao período de teste, permitimos apenas uma conta gratuita por pessoa/dispositivo.

## Planos e Pagamentos

### Diferença entre plano Free e Pago
O plano Free oferece todas as funcionalidades por 30 dias gratuitamente. Os planos pagos oferecem uso ilimitado, suporte prioritário e recursos avançados.

### Quando o Free acaba
Você receberá um aviso para fazer upgrade. Seus dados ficam salvos, mas você precisará assinar um plano para continuar usando.

### Fazer upgrade
1. Acesse o menu 'Planos'
2. Escolha o plano ideal
3. Clique em 'Assinar'
4. Complete o pagamento

### Formas de pagamento
Aceitamos cartões de crédito das principais bandeiras (Visa, Mastercard, Elo, American Express).

## Agenda e Agendamentos

### Criar horários na agenda
1. Acesse 'Barbeiros' no menu
2. Selecione o barbeiro
3. Configure os horários de trabalho por dia da semana
4. Defina intervalos de almoço se necessário
5. Salve as alterações

### Agendar um cliente
1. Acesse a 'Agenda'
2. Clique no horário desejado
3. Selecione o serviço
4. Preencha os dados do cliente
5. Confirme o agendamento

### Editar ou cancelar agendamento
1. Acesse a 'Agenda'
2. Clique no agendamento
3. Para editar: altere e salve
4. Para cancelar: clique em 'Cancelar Agendamento'

## Serviços e Preços

### Cadastrar serviços
1. Acesse 'Serviços' no menu
2. Clique em 'Novo Serviço'
3. Preencha nome, descrição e preço
4. Defina a duração
5. Salve

### Editar preços
1. Acesse 'Serviços'
2. Clique no serviço
3. Altere o preço
4. Clique em 'Salvar'

## Faturamento e Relatórios

### Registrar atendimento pago
1. Acesse a 'Agenda'
2. Clique no agendamento concluído
3. Marque como 'Concluído' ou 'Pago'
4. O valor será contabilizado automaticamente

### Ver faturamento
Acesse o 'Painel' para ver o resumo do faturamento do dia atual.

### Relatórios
Em 'Relatórios', você encontra análises detalhadas do seu faturamento por período.

## Integração WhatsApp - MUITO IMPORTANTE

### Como configurar o WhatsApp para enviar mensagens automáticas
Recomendamos fortemente usar o **UltraMsg** por ser o serviço mais fácil e rápido de configurar!

#### Passo a passo para configurar com UltraMsg:
1. **Crie sua conta no UltraMsg**
   - Acesse ultramsg.com e crie uma conta gratuita
   - Você terá 3 dias de teste grátis para testar

2. **Conecte seu WhatsApp**
   - No painel do UltraMsg, você verá um QR Code
   - No seu celular, vá em WhatsApp > Configurações > Aparelhos conectados
   - Clique em "Conectar um aparelho" e escaneie o QR Code

3. **Copie suas credenciais**
   - No painel do UltraMsg, copie sua "Instance ID" e "Token"
   - A URL da API será: https://api.ultramsg.com/instanceXXXXX/messages/chat
   - Substitua XXXXX pelo seu Instance ID

4. **Configure no app**
   - Vá em Configurações > WhatsApp no menu do app
   - Cole a URL da API, o Token e seu número de WhatsApp
   - Clique em "Salvar" e depois "Testar Envio"

#### Preços do UltraMsg:
- 3 dias grátis para testar
- Planos a partir de $39/mês
- Mensagens ilimitadas incluídas

#### Por que usar UltraMsg?
- Configuração em menos de 5 minutos
- Não precisa de WhatsApp Business API oficial
- Suporte técnico disponível
- Funciona com qualquer número de WhatsApp

#### Outras opções compatíveis:
- **Evolution API**: gratuito mas precisa de servidor próprio
- **Z-API**: alternativa brasileira similar ao UltraMsg

### Onde configurar o WhatsApp no app?
Acesse o menu lateral > Configurações > WhatsApp. Lá você encontra um guia completo passo a passo.

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

## Contato com Suporte

Se a IA não conseguir resolver a dúvida do usuário, SEMPRE sugira acessar a página de suporte:
"Se precisar de ajuda mais específica, você pode entrar em contato com nosso suporte pelo menu Ajuda > Falar com o Suporte. Atendimento de segunda a sexta, das 9h às 18h."

E-mail: suportegestbarber@gmail.com
Respondemos em até 24 horas úteis.
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
