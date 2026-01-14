import { 
  Rocket, 
  User, 
  CreditCard, 
  Calendar, 
  Scissors, 
  Users, 
  DollarSign, 
  Shield, 
  AlertTriangle, 
  MessageCircle,
  Crown,
  Globe,
  Sparkles,
  TrendingUp,
  LucideIcon
} from "lucide-react";

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  steps?: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  articles: HelpArticle[];
}

export const helpCategories: HelpCategory[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    icon: Rocket,
    description: "Comece a usar o app da melhor forma",
    articles: [
      {
        id: "o-que-e-o-app",
        title: "O que é o app e para que ele serve",
        content: "Nosso app é um sistema completo de gestão para barbearias. Com ele, você pode gerenciar sua agenda, cadastrar serviços, controlar clientes, acompanhar faturamento e muito mais. Tudo em um só lugar, de forma simples e prática."
      },
      {
        id: "como-criar-conta",
        title: "Como criar uma conta",
        content: "Criar sua conta é rápido e fácil. Vamos te mostrar como fazer isso em poucos passos.",
        steps: [
          "Acesse a página de cadastro clicando em 'Criar conta'",
          "Preencha seu nome completo e e-mail",
          "Crie uma senha segura (mínimo 6 caracteres)",
          "Clique em 'Cadastrar' e pronto!"
        ]
      },
      {
        id: "plano-free",
        title: "Como funciona o plano Free (30 dias)",
        content: "O plano Free te dá acesso a todas as funcionalidades do app por 30 dias, sem custo. É perfeito para você conhecer e testar tudo antes de decidir assinar. Após os 30 dias, você pode fazer upgrade para continuar usando."
      },
      {
        id: "primeiros-minutos",
        title: "O que fazer nos primeiros minutos no app",
        content: "Aproveite ao máximo o app seguindo esses passos iniciais.",
        steps: [
          "Complete seu perfil com o nome da barbearia",
          "Cadastre seus serviços (cortes, barba, etc.)",
          "Configure seus horários de trabalho",
          "Cadastre seus barbeiros (se tiver equipe)",
          "Comece a agendar clientes!"
        ]
      },
      {
        id: "primeiro-servico",
        title: "Como cadastrar o primeiro serviço",
        content: "Cadastrar serviços é essencial para começar a usar a agenda. Veja como fazer.",
        steps: [
          "Acesse o menu 'Serviços'",
          "Clique em 'Novo Serviço'",
          "Preencha o nome (ex: Corte Masculino)",
          "Defina o preço e a duração",
          "Clique em 'Salvar'"
        ]
      }
    ]
  },
  {
    id: "conta-acesso",
    title: "Conta e Acesso",
    icon: User,
    description: "Login, senha e configurações da conta",
    articles: [
      {
        id: "como-fazer-login",
        title: "Como fazer login",
        content: "Para acessar sua conta, use o e-mail e senha que você cadastrou.",
        steps: [
          "Acesse a página de login",
          "Digite seu e-mail cadastrado",
          "Digite sua senha",
          "Clique em 'Entrar'"
        ]
      },
      {
        id: "recuperar-senha",
        title: "Como recuperar a senha",
        content: "Esqueceu sua senha? Sem problemas! Vamos te ajudar a criar uma nova.",
        steps: [
          "Na tela de login, clique em 'Esqueci minha senha'",
          "Digite seu e-mail cadastrado",
          "Acesse seu e-mail e clique no link enviado",
          "Crie uma nova senha segura"
        ]
      },
      {
        id: "regras-senha",
        title: "Regras de segurança da senha",
        content: "Para manter sua conta segura, sua senha deve ter pelo menos 6 caracteres. Recomendamos usar letras, números e caracteres especiais. Não compartilhe sua senha com ninguém."
      },
      {
        id: "problemas-acesso",
        title: "Problemas comuns de acesso",
        content: "Se você está tendo dificuldades para acessar sua conta, verifique se o e-mail está correto, se a senha está certa (atenção às letras maiúsculas) e se sua conexão com a internet está funcionando."
      },
      {
        id: "conta-gratuita-unica",
        title: "Por que não consigo criar mais de uma conta gratuita",
        content: "Para garantir que todos tenham acesso justo ao período de teste, permitimos apenas uma conta gratuita por pessoa/dispositivo. Isso evita abusos e mantém o sistema funcionando bem para todos."
      }
    ]
  },
  {
    id: "planos-pagamentos",
    title: "Planos e Pagamentos",
    icon: CreditCard,
    description: "Informações sobre planos e cobrança",
    articles: [
      {
        id: "diferenca-planos",
        title: "Diferença entre plano Free e plano Pago",
        content: "O plano Free oferece todas as funcionalidades por 30 dias gratuitamente. Os planos pagos oferecem uso ilimitado, suporte prioritário e recursos avançados como relatórios detalhados e automações."
      },
      {
        id: "quando-free-acaba",
        title: "O que acontece quando o Free acaba",
        content: "Quando o período de 30 dias termina, você receberá um aviso para fazer upgrade. Seus dados ficam salvos, mas você precisará assinar um plano para continuar usando o app."
      },
      {
        id: "fazer-upgrade",
        title: "Como fazer upgrade de plano",
        content: "Fazer upgrade é simples e rápido.",
        steps: [
          "Acesse o menu 'Planos'",
          "Escolha o plano ideal para você",
          "Clique em 'Assinar'",
          "Complete o pagamento",
          "Pronto! Seu plano está ativo"
        ]
      },
      {
        id: "formas-pagamento",
        title: "Formas de pagamento aceitas",
        content: "Aceitamos cartões de crédito das principais bandeiras (Visa, Mastercard, Elo, American Express). O pagamento é processado de forma segura pelo Stripe."
      },
      {
        id: "cancelamento-renovacao",
        title: "Cancelamento e renovação",
        content: "Você pode cancelar seu plano a qualquer momento nas configurações da conta. A renovação é automática, mas você sempre será avisado antes da cobrança."
      }
    ]
  },
  {
    id: "agenda-agendamentos",
    title: "Agenda e Agendamentos",
    icon: Calendar,
    description: "Gerencie sua agenda de atendimentos",
    articles: [
      {
        id: "criar-horarios",
        title: "Como criar horários na agenda",
        content: "Configure os horários em que você atende para que os clientes possam agendar.",
        steps: [
          "Acesse 'Barbeiros' no menu",
          "Selecione o barbeiro",
          "Configure os horários de trabalho por dia da semana",
          "Defina intervalos de almoço se necessário",
          "Salve as alterações"
        ]
      },
      {
        id: "agendar-cliente",
        title: "Como agendar um cliente",
        content: "Agendar clientes é fácil e rápido.",
        steps: [
          "Acesse a 'Agenda'",
          "Clique no horário desejado",
          "Selecione o serviço",
          "Preencha os dados do cliente",
          "Confirme o agendamento"
        ]
      },
      {
        id: "editar-cancelar",
        title: "Como editar ou cancelar um agendamento",
        content: "Precisa alterar ou cancelar? Veja como fazer.",
        steps: [
          "Acesse a 'Agenda'",
          "Clique no agendamento que deseja alterar",
          "Para editar: altere as informações e salve",
          "Para cancelar: clique em 'Cancelar Agendamento'"
        ]
      },
      {
        id: "evitar-conflitos",
        title: "Como evitar conflitos de horários",
        content: "O app impede automaticamente agendamentos em horários já ocupados. Configure corretamente a duração de cada serviço para evitar sobreposições."
      }
    ]
  },
  {
    id: "servicos-precos",
    title: "Serviços e Preços",
    icon: Scissors,
    description: "Cadastre e organize seus serviços",
    articles: [
      {
        id: "cadastrar-servicos",
        title: "Como cadastrar serviços",
        content: "Cadastre todos os serviços que você oferece na barbearia.",
        steps: [
          "Acesse 'Serviços' no menu",
          "Clique em 'Novo Serviço'",
          "Preencha nome, descrição e preço",
          "Defina a duração do serviço",
          "Salve o serviço"
        ]
      },
      {
        id: "editar-precos",
        title: "Como editar preços",
        content: "Atualizar preços é simples.",
        steps: [
          "Acesse 'Serviços'",
          "Clique no serviço que deseja editar",
          "Altere o preço",
          "Clique em 'Salvar'"
        ]
      },
      {
        id: "varios-servicos",
        title: "Posso ter mais de um serviço?",
        content: "Sim! Você pode cadastrar quantos serviços precisar. Corte, barba, sobrancelha, combo... organize da forma que preferir."
      },
      {
        id: "organizar-servicos",
        title: "Como organizar meus serviços",
        content: "Use nomes claros e descrições objetivas. Defina preços justos e durações realistas. Mantenha seus serviços atualizados e desative os que não oferece mais."
      }
    ]
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: Users,
    description: "Gerencie sua base de clientes",
    articles: [
      {
        id: "cadastrar-clientes",
        title: "Como cadastrar clientes",
        content: "Os clientes são cadastrados automaticamente quando você cria um agendamento. Basta preencher nome e telefone durante o agendamento."
      },
      {
        id: "editar-cliente",
        title: "Como editar dados do cliente",
        content: "Para atualizar informações de um cliente, acesse o agendamento dele ou o histórico de atendimentos e faça as alterações necessárias."
      },
      {
        id: "historico-atendimentos",
        title: "Histórico de atendimentos",
        content: "Você pode ver todo o histórico de atendimentos de cada cliente, incluindo serviços realizados, datas e valores pagos. Isso ajuda a conhecer melhor seus clientes."
      }
    ]
  },
  {
    id: "faturamento-relatorios",
    title: "Faturamento e Relatórios",
    icon: DollarSign,
    description: "Acompanhe suas finanças",
    articles: [
      {
        id: "registrar-pagamento",
        title: "Como registrar um atendimento pago",
        content: "Após concluir um atendimento, marque-o como pago para que entre no seu faturamento.",
        steps: [
          "Acesse a 'Agenda'",
          "Clique no agendamento concluído",
          "Marque como 'Concluído' ou 'Pago'",
          "O valor será contabilizado automaticamente"
        ]
      },
      {
        id: "faturamento-dia",
        title: "Como ver o faturamento do dia",
        content: "Acesse o 'Painel' para ver o resumo do faturamento do dia atual, incluindo total de atendimentos e valores recebidos."
      },
      {
        id: "relatorio-semanal-mensal",
        title: "Relatório semanal e mensal",
        content: "Em 'Relatórios', você encontra análises detalhadas do seu faturamento por período. Veja tendências, compare semanas e meses, e tome decisões mais inteligentes."
      },
      {
        id: "o-que-entra-faturamento",
        title: "O que entra no faturamento",
        content: "Entram no faturamento todos os atendimentos marcados como concluídos/pagos, vendas de produtos e qualquer entrada registrada no caixa."
      }
    ]
  },
  {
    id: "seguranca-privacidade",
    title: "Segurança e Privacidade",
    icon: Shield,
    description: "Como protegemos seus dados",
    articles: [
      {
        id: "protecao-dados",
        title: "Como protegemos seus dados",
        content: "Usamos criptografia de ponta a ponta para proteger suas informações. Seus dados são armazenados em servidores seguros e nunca são compartilhados com terceiros."
      },
      {
        id: "regras-anti-fraude",
        title: "Regras anti-fraude do plano Free",
        content: "Para garantir que o período gratuito seja justo para todos, monitoramos tentativas de criar múltiplas contas. Cada pessoa pode ter apenas uma conta gratuita."
      },
      {
        id: "uso-ip-dispositivo",
        title: "Uso de IP e dispositivo",
        content: "Utilizamos informações do seu dispositivo e IP apenas para segurança e prevenção de fraudes. Isso nos ajuda a proteger sua conta e garantir que apenas você tenha acesso."
      },
      {
        id: "lgpd-privacidade",
        title: "LGPD e privacidade",
        content: "Seguimos todas as normas da LGPD (Lei Geral de Proteção de Dados). Você tem direito a saber quais dados coletamos, solicitar correções ou exclusão. Entre em contato conosco para exercer seus direitos."
      }
    ]
  },
  {
    id: "problemas-comuns",
    title: "Problemas Comuns",
    icon: AlertTriangle,
    description: "Soluções para dificuldades frequentes",
    articles: [
      {
        id: "nao-acesso-conta",
        title: "Não consigo acessar minha conta",
        content: "Se você não consegue acessar sua conta, tente os seguintes passos.",
        steps: [
          "Verifique se o e-mail está correto",
          "Confira se a senha está certa (atenção às maiúsculas)",
          "Tente recuperar a senha",
          "Limpe o cache do navegador",
          "Se persistir, entre em contato com o suporte"
        ]
      },
      {
        id: "app-nao-carrega",
        title: "App não carrega",
        content: "Se o app não está carregando corretamente, verifique sua conexão com a internet. Tente atualizar a página ou limpar o cache do navegador. Se o problema persistir, entre em contato conosco."
      },
      {
        id: "agendamento-nao-aparece",
        title: "Agendamento não aparece",
        content: "Se um agendamento não está aparecendo, verifique a data selecionada na agenda e os filtros ativos. Tente atualizar a página. Se o problema continuar, entre em contato com o suporte."
      },
      {
        id: "dados-nao-atualizam",
        title: "Dados não atualizam",
        content: "Se os dados não estão atualizando, verifique sua conexão com a internet. Tente sair e entrar novamente no app. Limpe o cache do navegador se necessário."
      }
    ]
  },
  {
    id: "falar-suporte",
    title: "Falar com o Suporte",
    icon: MessageCircle,
    description: "Entre em contato conosco",
    articles: [
      {
        id: "quando-falar-suporte",
        title: "Quando devo falar com o suporte",
        content: "Fale conosco quando você já tentou resolver o problema sozinho e não conseguiu, quando encontrou um erro que não sabe resolver, ou quando tem uma sugestão para melhorar o app."
      },
      {
        id: "canal-contato",
        title: "Canal de contato",
        content: "Você pode entrar em contato conosco através do e-mail suporte@gestbarber.com.br. Respondemos em até 24 horas úteis."
      },
      {
        id: "mensagem-padrao",
        title: "Como enviar uma boa mensagem para o suporte",
        content: "Para agilizar o atendimento, inclua na sua mensagem: seu e-mail cadastrado, descrição clara do problema, o que você já tentou fazer, e prints de tela se possível."
      }
    ]
  },
  {
    id: "recursos-growth",
    title: "Recursos Avançados (Growth)",
    icon: Crown,
    description: "Funcionalidades exclusivas do plano Growth",
    articles: [
      {
        id: "sobre-plano-growth",
        title: "O que é o plano Growth",
        content: "O plano Growth é o plano mais completo do app, com recursos avançados para fazer sua barbearia crescer. Inclui Site com IA, Google Business Profile, Growth Engine, suporte prioritário e muito mais."
      },
      {
        id: "conectar-google-business",
        title: "Como conectar ao Google Business Profile",
        content: "O Google Business Profile ajuda sua barbearia a aparecer no Google Maps e nas buscas locais. Conecte sua conta para gerenciar avaliações e aumentar sua visibilidade.",
        steps: [
          "Acesse 'Meu Perfil' no menu lateral",
          "Role até a seção 'Google Business Profile'",
          "Clique em 'Conectar com Google'",
          "Faça login com sua conta Google que gerencia o perfil",
          "Selecione a conta e o local do seu negócio",
          "Pronto! Seus dados serão sincronizados automaticamente"
        ]
      },
      {
        id: "beneficios-google-business",
        title: "Benefícios do Google Business Profile",
        content: "Com o Google Business conectado, você pode: ver quantas pessoas encontraram sua barbearia no Google, acompanhar e responder avaliações, ver quantas ligações e pedidos de rota recebeu, e aumentar sua visibilidade local."
      },
      {
        id: "criar-site-ia",
        title: "Como criar seu site com IA",
        content: "Crie um site profissional para sua barbearia em segundos usando inteligência artificial. O site inclui suas informações, serviços e link para agendamento.",
        steps: [
          "Acesse 'Meu Perfil' no menu lateral",
          "Role até a seção 'Criar Site com IA'",
          "Preencha o nome da barbearia e WhatsApp",
          "Adicione endereço e cidade (opcional)",
          "Escolha um tema de cores",
          "Clique em 'Criar Site com IA'",
          "Aguarde a geração e copie o link do seu novo site!"
        ]
      },
      {
        id: "personalizar-site",
        title: "Personalizando seu site",
        content: "Após criar o site, você pode ver as informações cadastradas e o link público. Para atualizar o site, clique em 'Recriar Site' e faça as alterações desejadas. A IA irá gerar uma nova versão com as informações atualizadas."
      },
      {
        id: "o-que-e-growth-engine",
        title: "O que é o Growth Engine",
        content: "O Growth Engine é um painel inteligente que analisa sua barbearia e mostra oportunidades de crescimento. Ele identifica clientes inativos, horários vazios, cancelamentos e muito mais."
      },
      {
        id: "usar-growth-engine",
        title: "Como usar o Growth Engine",
        content: "Acesse o Growth Engine pelo menu lateral para ver insights sobre seu negócio.",
        steps: [
          "Acesse 'Growth Engine' no menu lateral",
          "Veja os cards com alertas e oportunidades",
          "Clique em cada card para ver detalhes",
          "Siga as recomendações para recuperar receita",
          "Acompanhe clientes inativos na fila de reativação",
          "Use os lembretes sugeridos para engajar clientes"
        ]
      },
      {
        id: "metricas-growth-engine",
        title: "Métricas do Growth Engine",
        content: "O Growth Engine mostra: horários vazios do dia, clientes que não voltam há mais de 30 dias, valor perdido com cancelamentos e no-shows, clientes problemáticos (que cancelam muito), e sugestões de mensagens para reativar clientes."
      }
    ]
  }
];

export const searchArticles = (query: string): { category: HelpCategory; article: HelpArticle }[] => {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  
  const results: { category: HelpCategory; article: HelpArticle }[] = [];
  
  helpCategories.forEach(category => {
    category.articles.forEach(article => {
      const titleMatch = article.title.toLowerCase().includes(normalizedQuery);
      const contentMatch = article.content.toLowerCase().includes(normalizedQuery);
      const stepsMatch = article.steps?.some(step => step.toLowerCase().includes(normalizedQuery));
      
      if (titleMatch || contentMatch || stepsMatch) {
        results.push({ category, article });
      }
    });
  });
  
  return results;
};
